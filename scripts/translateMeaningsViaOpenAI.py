#!/usr/bin/env python3
"""
translateMeaningsViaOpenAI.py

Translate English canonical_name_meanings rows into the 10 non-English
locales the BabySwipe app supports. Output is JSONL in the
applyEnrichmentBatch shape, so the existing `npm run enrich:apply`
workflow consumes it unchanged.

Why this exists
───────────────
After enrichmentFromOpenAI.py fills canonical_name_meanings for English,
non-English users still see nothing for those names. This script reads
every CNM row where meaning_language='en', figures out which (name,
locale) pairs are missing, and generates them with gpt-4o-mini.

App locales: en (source) + nl, de, fr, es, it, pt, zh, ja, ko, ar.

Architecture decision
─────────────────────
Writes to `canonical_name_meanings` (one row per canonical_name_id +
meaning_language + gender_scope), NOT to `name_meaning_translations`.
The applier RPC's monotonic UPSERT handles duplicates idempotently.

The legacy `name_meaning_translations` table still works as a fallback
for older app code, but canonical_name_meanings becomes the source of
truth going forward.

Resumability
────────────
Two layers:
1. Pre-flight: query CNM for existing (canonical_name_id, locale) pairs
   and skip them — saves OpenAI tokens.
2. `--resume`: read canonical_name_ids already present in --out and
   skip them too. Use when re-running after a crash.

Cost expectation
────────────────
~15k English source meanings × 10 locales = 150k translations.
Per-locale chunks of 24 names → ~6 250 chunks → ~5M tokens → ~$1.50
at gpt-4o-mini. At concurrency 6 and ~3s per chunk: ~50 minutes.

Usage
─────
    set -a; source .env.scripts; set +a
    python3 scripts/translateMeaningsViaOpenAI.py \\
      --out scripts/data/meaning-enrichment/openai-translations.jsonl \\
      --concurrency 6 --resume

Required env: OPENAI_API_KEY, EXPO_PUBLIC_SUPABASE_URL,
              SUPABASE_SERVICE_ROLE_KEY
Optional env: OPENAI_ENRICHMENT_MODEL (default: gpt-4o-mini)

CLI flags
─────────
    --out PATH                   output JSONL (required)
    --rejects-out PATH           rejects JSONL (default: <out>.rejects.jsonl)
    --concurrency N              parallel API calls (default 6, max 16)
    --chunk-size N               names per API call (default 24, max 40)
    --limit N                    cap (name × locale) translations to N (0 = all)
    --resume                     skip canonical_name_ids already in --out
    --locales LIST               comma-separated, default:
                                 nl,de,fr,es,it,pt,zh,ja,ko,ar
    --model NAME                 override OPENAI_ENRICHMENT_MODEL
    --source-language CODE       source locale to read from CNM (default en)
"""

import argparse
import concurrent.futures as cf
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional

# ── Constants ──────────────────────────────────────────────────────────────
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

# Source priority for OpenAI translations. Higher = lower priority than
# curated (4) and Wikidata (3); aligns with enrichmentFromOpenAI (6).
SOURCE_PRIORITY_OPENAI = 6

# Pretty names so the prompt is unambiguous. Matches Behind-the-Name +
# Wikipedia conventions for app-friendly target language labels.
LOCALE_NAMES = {
    "nl": "Dutch",
    "de": "German",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "zh": "Simplified Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Modern Standard Arabic",
}

DEFAULT_LOCALES = "nl,de,fr,es,it,pt,zh,ja,ko,ar"


def build_system_prompt(target_locale: str) -> str:
    """Per-locale prompt. Keeps the translation focused and consistent."""
    locale_name = LOCALE_NAMES.get(target_locale, target_locale)
    return f"""You translate short English baby-name meaning phrases into {locale_name}.

For each name in the user's list, return a translation of its English meaning into {locale_name}.

Rules:
- Translate only the meaning text — never translate the given name itself.
- Keep the translation short and natural in {locale_name}, suited to a mobile-app UI.
- Preserve the same punctuation style (semicolons, quotes around literal glosses).
- Do not add explanations, language tags, brackets, or quotes around the output.
- If the source meaning genuinely cannot be translated (e.g. a transliteration-only term), return the closest natural rendering rather than English.
- Do not return English unchanged except for unavoidable proper nouns or technical terms.

Return ONLY a JSON object with key "translations" whose value is an array of:
{{"name":"X","meaning":"<translated meaning>"}}"""


# ── CLI parsing ────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out", dest="out_path", required=True)
    p.add_argument("--rejects-out", dest="rejects_path", default=None)
    p.add_argument("--concurrency", type=int, default=6)
    p.add_argument("--chunk-size", type=int, default=24)
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--resume", action="store_true")
    p.add_argument("--locales", default=DEFAULT_LOCALES)
    p.add_argument("--model", default=None)
    p.add_argument("--source-language", default="en")
    args = p.parse_args()

    if not 1 <= args.concurrency <= 16:
        p.error(f"--concurrency must be 1..16; got {args.concurrency}")
    if not 1 <= args.chunk_size <= 40:
        p.error(f"--chunk-size must be 1..40; got {args.chunk_size}")
    args.locale_list = [l.strip() for l in args.locales.split(",") if l.strip()]
    if not args.locale_list:
        p.error("--locales must list at least one target locale")
    for loc in args.locale_list:
        if loc == args.source_language:
            p.error(f"--locales cannot include the source language '{loc}'")
    args.model = (
        args.model
        or os.environ.get("OPENAI_ENRICHMENT_MODEL", "").strip()
        or "gpt-4o-mini"
    )
    if not args.rejects_path:
        args.rejects_path = (
            args.out_path[:-6] + ".rejects.jsonl"
            if args.out_path.endswith(".jsonl")
            else args.out_path + ".rejects.jsonl"
        )
    return args


# ── Supabase REST helpers ──────────────────────────────────────────────────
def supabase_page(url: str, key: str, table: str, qs: str, page_size: int = 1000):
    """Paginate over a Supabase REST endpoint."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    offset = 0
    while True:
        full = f"{url}/rest/v1/{table}?{qs}&limit={page_size}&offset={offset}"
        req = urllib.request.Request(full, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        if not rows:
            break
        for row in rows:
            yield row
        if len(rows) < page_size:
            break
        offset += page_size


def load_source_meanings(
    url: str, key: str, source_lang: str
) -> list[dict]:
    """Read every canonical_name_meanings row in the source language.

    Production canonical_name_meanings schema omits the optional `origin`
    column (which only exists on the migration 20260612 dev shape). We
    leave origin empty on translation rows — they inherit nothing from
    that column, and the apply RPC handles empty-string origins fine.
    """
    qs = (
        "select=canonical_name_id,gender_scope,meaning&"
        f"meaning_language=eq.{source_lang}"
    )
    out = []
    for r in supabase_page(url, key, "canonical_name_meanings", qs):
        cid = r.get("canonical_name_id")
        meaning = r.get("meaning")
        if not cid or not isinstance(meaning, str) or not meaning.strip():
            continue
        out.append(
            {
                "canonical_name_id": cid,
                "gender_scope": r.get("gender_scope") or "any",
                "meaning": meaning.strip(),
                "origin": "",
            }
        )
    return out


def load_existing_target_pairs(
    url: str, key: str, source_lang: str
) -> set[tuple]:
    """Get all (canonical_name_id, meaning_language) pairs that are NOT source.
    Used to skip translations that already exist in canonical_name_meanings."""
    qs = (
        "select=canonical_name_id,meaning_language&"
        f"meaning_language=neq.{source_lang}"
    )
    pairs = set()
    for r in supabase_page(url, key, "canonical_name_meanings", qs):
        cid = r.get("canonical_name_id")
        loc = r.get("meaning_language")
        if cid and loc:
            pairs.add((cid, loc))
    return pairs


def load_display_names(url: str, key: str, canonical_ids: set[str]) -> dict[str, str]:
    """Look up display_name + normalized_name per canonical_name_id.
    Batched in chunks to respect URL length limits."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    result: dict[str, dict] = {}
    ids_list = sorted(canonical_ids)
    for i in range(0, len(ids_list), 100):
        batch = ids_list[i : i + 100]
        in_clause = "in.(" + ",".join(batch) + ")"
        qs = f"select=id,display_name,normalized_name&id={in_clause}"
        full = f"{url}/rest/v1/canonical_names?{qs}"
        req = urllib.request.Request(full, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        for row in rows:
            cid = row.get("id")
            if not cid:
                continue
            result[cid] = {
                "display_name": row.get("display_name") or "",
                "normalized_name": row.get("normalized_name") or "",
            }
    return result


# ── Resume support ─────────────────────────────────────────────────────────
def read_done_pairs(out_path: str) -> set[tuple]:
    """Read canonical_name_ids × meaning_language pairs already emitted."""
    if not os.path.exists(out_path):
        return set()
    done = set()
    with open(out_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                cid = row.get("canonical_name_id")
                lang = row.get("meaning_language")
                if cid and lang:
                    done.add((cid, lang))
            except json.JSONDecodeError:
                continue
    return done


# ── OpenAI call ────────────────────────────────────────────────────────────
def call_gpt(
    api_key: str,
    model: str,
    target_locale: str,
    items: list[dict],
    timeout: int = 60,
) -> list[dict]:
    """items: [{display_name, meaning}, ...]"""
    name_lines = [
        f'{i+1}. {it["display_name"]}: "{it["meaning"]}"'
        for i, it in enumerate(items)
    ]
    user_msg = (
        f"Translate the meaning for each of these names into "
        f"{LOCALE_NAMES.get(target_locale, target_locale)}:\n"
        + "\n".join(name_lines)
        + "\n\nReturn the JSON object now."
    )
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": build_system_prompt(target_locale)},
            {"role": "user", "content": user_msg},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        OPENAI_URL,
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        resp = json.loads(r.read())
    content = (
        resp.get("choices", [{}])[0].get("message", {}).get("content", "")
    )
    parsed = json.loads(content)
    if isinstance(parsed, list):
        return parsed
    for k in ("translations", "results", "meanings", "data"):
        if isinstance(parsed.get(k), list):
            return parsed[k]
    raise ValueError(f"GPT response had no array key: {content[:200]!r}")


# ── Validation + row construction ──────────────────────────────────────────
def is_translation_invalid(meaning: str, display_name: str) -> Optional[str]:
    m = meaning.strip()
    if not m:
        return "empty translation"
    if len(m) < 3:
        return "translation too short"
    if len(m) > 280:
        return "translation too long"
    if m.lower() == "unknown":
        return 'model returned "unknown"'
    if any(
        m.lower().startswith(p)
        for p in ("i don't", "i do not", "sorry", "unfortunately")
    ):
        return "looks like a refusal"
    return None


def build_cnm_row(
    src: dict, display_name: str, normalized_name: str,
    target_locale: str, translation: str, model: str
) -> dict:
    """Construct an applyEnrichmentBatch-shaped row."""
    return {
        "canonical_name_id": src["canonical_name_id"],
        "meaning": translation.strip(),
        "origin": src.get("origin", ""),
        "gender_scope": src.get("gender_scope") or "any",
        "meaning_language": target_locale,
        "meaning_source": f"openai:{model}:translation",
        "meaning_confidence": 0.8,  # translation of an already-vetted EN meaning
        "meaning_verified": False,
        "source_priority": SOURCE_PRIORITY_OPENAI,
        "review_status": "auto",
        "context": {
            "enrichment_stage": "openai-translation",
            "pipeline_version": "openai-translations-v1-py",
            "normalized_name": normalized_name,
            "display_name": display_name,
            "source_language": "en",
            "source_meaning": src["meaning"][:160],
        },
    }


# ── Main ───────────────────────────────────────────────────────────────────
def main() -> None:
    args = parse_args()
    api_key = os.environ.get("OPENAI_API_KEY")
    sb_url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not api_key:
        print("Missing OPENAI_API_KEY.", file=sys.stderr)
        sys.exit(1)
    if not sb_url or not sb_key:
        print("Missing EXPO_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.",
              file=sys.stderr)
        sys.exit(1)

    print(
        f"[translateMeaningsViaOpenAI] out={args.out_path} "
        f"model={args.model} chunk={args.chunk_size} concurrency={args.concurrency} "
        f"locales={','.join(args.locale_list)}"
    )

    Path(args.out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.rejects_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_path).touch()
    Path(args.rejects_path).touch()

    print("[translateMeaningsViaOpenAI] loading source meanings...", flush=True)
    sources = load_source_meanings(sb_url, sb_key, args.source_language)
    print(f"  {len(sources)} source (language={args.source_language}) meanings",
          flush=True)

    print("[translateMeaningsViaOpenAI] loading existing target pairs...",
          flush=True)
    existing = load_existing_target_pairs(sb_url, sb_key, args.source_language)
    print(f"  {len(existing)} (cid, locale) pairs already in CNM", flush=True)

    # Pull display_name + normalized_name for every source canonical_name_id
    print("[translateMeaningsViaOpenAI] looking up display names...", flush=True)
    cid_set = {s["canonical_name_id"] for s in sources}
    display_map = load_display_names(sb_url, sb_key, cid_set)
    print(f"  resolved {len(display_map)} display names", flush=True)

    # Resume: pairs already in --out
    resume_pairs: set[tuple] = set()
    if args.resume:
        resume_pairs = read_done_pairs(args.out_path)
        print(
            f"[translateMeaningsViaOpenAI] resume — {len(resume_pairs)} pairs "
            "already in --out",
            flush=True,
        )

    # Build the work queue: per locale × per source, skipping existing + resume
    per_locale_jobs: dict[str, list[dict]] = {loc: [] for loc in args.locale_list}
    skipped_existing = 0
    skipped_resume = 0
    for src in sources:
        cid = src["canonical_name_id"]
        dn = display_map.get(cid, {}).get("display_name") or ""
        nn = display_map.get(cid, {}).get("normalized_name") or ""
        if not dn:
            continue
        src["display_name"] = dn
        src["normalized_name"] = nn
        for loc in args.locale_list:
            pair = (cid, loc)
            if pair in existing:
                skipped_existing += 1
                continue
            if pair in resume_pairs:
                skipped_resume += 1
                continue
            per_locale_jobs[loc].append(src)

    total = sum(len(v) for v in per_locale_jobs.values())
    print(
        f"[translateMeaningsViaOpenAI] queued {total} translations "
        f"(skipped {skipped_existing} existing + {skipped_resume} resume)",
        flush=True,
    )

    if args.limit > 0:
        # Cap evenly across locales for sample runs
        per_locale_cap = max(1, args.limit // len(args.locale_list))
        for loc in per_locale_jobs:
            per_locale_jobs[loc] = per_locale_jobs[loc][:per_locale_cap]
        total = sum(len(v) for v in per_locale_jobs.values())
        print(
            f"[translateMeaningsViaOpenAI] --limit={args.limit} applied → {total}",
            flush=True,
        )

    # Chunk per-locale
    chunks: list[tuple[str, list[dict]]] = []
    for loc, jobs in per_locale_jobs.items():
        for i in range(0, len(jobs), args.chunk_size):
            chunks.append((loc, jobs[i : i + args.chunk_size]))
    print(
        f"[translateMeaningsViaOpenAI] {len(chunks)} chunks of up to "
        f"{args.chunk_size} translations",
        flush=True,
    )

    started = time.time()
    ok_total = 0
    rej_total = 0
    done_chunks = 0

    def process_chunk(item: tuple[str, list[dict]]) -> tuple[int, int]:
        target_locale, items = item
        try:
            gpt = call_gpt(api_key, args.model, target_locale, items)
        except Exception as e:
            reason = f"gpt-call-failed: {e}"
            with open(args.rejects_path, "a") as f:
                for it in items:
                    f.write(
                        json.dumps(
                            {
                                "canonical_name_id": it["canonical_name_id"],
                                "display_name": it["display_name"],
                                "target_locale": target_locale,
                                "reason": reason,
                            }
                        )
                        + "\n"
                    )
            return 0, len(items)

        by_name = {}
        for r in gpt:
            if isinstance(r, dict) and isinstance(r.get("name"), str):
                by_name[r["name"].lower()] = r

        ok_lines: list[str] = []
        rej_lines: list[str] = []
        for i, src in enumerate(items):
            candidate = by_name.get(src["display_name"].lower())
            if candidate is None and i < len(gpt) and isinstance(gpt[i], dict):
                candidate = gpt[i]
            if not candidate or not isinstance(candidate.get("meaning"), str):
                rej_lines.append(
                    json.dumps(
                        {
                            "canonical_name_id": src["canonical_name_id"],
                            "display_name": src["display_name"],
                            "target_locale": target_locale,
                            "reason": "no-matching-gpt-row",
                        }
                    )
                    + "\n"
                )
                continue
            reason = is_translation_invalid(
                candidate["meaning"], src["display_name"]
            )
            if reason:
                rej_lines.append(
                    json.dumps(
                        {
                            "canonical_name_id": src["canonical_name_id"],
                            "display_name": src["display_name"],
                            "target_locale": target_locale,
                            "reason": reason,
                            "raw": candidate["meaning"],
                        }
                    )
                    + "\n"
                )
                continue
            row = build_cnm_row(
                src,
                src["display_name"],
                src["normalized_name"],
                target_locale,
                candidate["meaning"],
                args.model,
            )
            ok_lines.append(json.dumps(row) + "\n")

        if ok_lines:
            with open(args.out_path, "a") as f:
                f.write("".join(ok_lines))
        if rej_lines:
            with open(args.rejects_path, "a") as f:
                f.write("".join(rej_lines))
        return len(ok_lines), len(rej_lines)

    with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(process_chunk, c) for c in chunks]
        for fut in cf.as_completed(futures):
            ok, rej = fut.result()
            ok_total += ok
            rej_total += rej
            done_chunks += 1
            if done_chunks % 10 == 0 or done_chunks == len(chunks):
                elapsed = max(time.time() - started, 0.1)
                print(
                    f"[translateMeaningsViaOpenAI] chunks={done_chunks}/{len(chunks)} "
                    f"ok={ok_total} rejected={rej_total} "
                    f"rate={ok_total/elapsed:.1f}/s",
                    flush=True,
                )

    elapsed = time.time() - started
    print(
        f"\n[translateMeaningsViaOpenAI] done. "
        f"{done_chunks} chunks processed in {elapsed:.1f}s.",
        flush=True,
    )
    print(f"  ok rows written:   {ok_total}  → {args.out_path}", flush=True)
    print(f"  rejected rows:     {rej_total}  → {args.rejects_path}", flush=True)
    print(
        f"\nNext step:\n"
        f"  npm run enrich:apply:dry-run -- --in {args.out_path}\n"
        f"  npm run enrich:apply -- --in {args.out_path} "
        f"--batch-size 500 --concurrency 4",
        flush=True,
    )


if __name__ == "__main__":
    main()
