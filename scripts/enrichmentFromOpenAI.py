#!/usr/bin/env python3
"""
enrichmentFromOpenAI.py

Python equivalent of scripts/enrichmentFromOpenAI.ts. Generates English
etymological meanings for the canonical-name gap queue via OpenAI Chat
Completions, in the JSONL shape that `npm run enrich:apply` consumes.

Why this exists
───────────────
The TypeScript version hangs at module load under Node 24 native
--experimental-strip-types + the openai SDK's CommonJS shim. tsx
swallows the hang silently. Rather than fight Node toolchain
edge-cases, this version uses Python's urllib so there are no
external deps — works with any Python 3.8+ install, no `pip install`
required.

Same JSONL output → same applyEnrichmentBatch flow.

Usage
─────
    set -a; source .env.scripts; set +a
    python3 scripts/enrichmentFromOpenAI.py \\
      --in scripts/data/meaning-enrichment/gaps-en-any.jsonl \\
      --out scripts/data/meaning-enrichment/openai-en-any.jsonl \\
      --concurrency 6 --resume

Required env: OPENAI_API_KEY
Optional env: OPENAI_ENRICHMENT_MODEL (default: gpt-4o-mini)

CLI flags
─────────
    --in PATH                    gap-queue JSONL (required)
    --out PATH                   output JSONL (required)
    --rejects-out PATH           rejects JSONL (default: <out>.rejects.jsonl)
    --concurrency N              parallel API calls (default 4, max 16)
    --chunk-size N               names per API call (default 12, max 40)
    --limit N                    cap names processed (0 = all)
    --resume                     skip canonical_name_ids already in --out
    --model NAME                 override OPENAI_ENRICHMENT_MODEL
    --flag-below 0.7             mark review_status='flagged' below this
"""

import argparse
import concurrent.futures as cf
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

# ── Constants ──────────────────────────────────────────────────────────────
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
SOURCE_PRIORITY_OPENAI = 6  # higher = lower-priority than curated (4)/wiki (3)

SYSTEM_PROMPT = """You provide brief, accurate etymological meanings for given names used in a baby-name app.

For each name in the user's list, return a one-sentence meaning that includes:
- The etymological origin/derivation
- The literal meaning if known
- The cultural/religious significance if highly relevant

If you genuinely don't know a name's meaning, return confidence: 0 and meaning: "unknown".

Rules:
- Each meaning must be 5-160 characters.
- Origin must be a short label like "Hebrew", "Arabic", "Greek", "Old English", "Latin", "Slavic", "Germanic", "Celtic", "Sanskrit", or a more specific tradition.
- Confidence is a number 0..1 representing your certainty.
- Do not add disclaimers, caveats, or "I believe..." prefixes — write the meaning as a fact.
- Do not return the name itself as the meaning ("Maria means Maria" is invalid).

Return ONLY a JSON object with key "results" whose value is an array of:
{"name":"X","meaning":"Y","origin":"Z","confidence":0.85}"""


# ── CLI parsing ────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--in", dest="in_path", required=True)
    p.add_argument("--out", dest="out_path", required=True)
    p.add_argument("--rejects-out", dest="rejects_path", default=None)
    p.add_argument("--concurrency", type=int, default=4)
    p.add_argument("--chunk-size", type=int, default=12)
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--resume", action="store_true")
    p.add_argument("--model", default=None)
    p.add_argument("--flag-below", type=float, default=0.7)
    args = p.parse_args()

    if not 1 <= args.concurrency <= 16:
        p.error(f"--concurrency must be 1..16; got {args.concurrency}")
    if not 1 <= args.chunk_size <= 40:
        p.error(f"--chunk-size must be 1..40; got {args.chunk_size}")
    if not 0 <= args.flag_below <= 1:
        p.error(f"--flag-below must be 0..1; got {args.flag_below}")

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


# ── Gap-queue loading + resume ──────────────────────────────────────────────
def load_gap_queue(path: str) -> list[dict]:
    out = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("canonical_name_id") and row.get("display_name"):
                out.append(row)
    return out


def read_done_ids(path: str) -> set[str]:
    if not os.path.exists(path):
        return set()
    done = set()
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                if row.get("canonical_name_id"):
                    done.add(row["canonical_name_id"])
            except json.JSONDecodeError:
                pass
    return done


# ── OpenAI call ────────────────────────────────────────────────────────────
def call_gpt(
    api_key: str, model: str, chunk: list[dict], timeout: int = 60
) -> list[dict]:
    user_msg = (
        "Names:\n"
        + "\n".join(f"{i+1}. {c['display_name']}" for i, c in enumerate(chunk))
        + "\n\nReturn the JSON object with key 'results' now."
    )
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
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
    for k in ("results", "meanings", "names", "data"):
        if isinstance(parsed.get(k), list):
            return parsed[k]
    raise ValueError(f"GPT response had no array key: {content[:200]!r}")


# ── Validation + row construction ──────────────────────────────────────────
def is_meaning_invalid(meaning: str, display_name: str) -> Optional[str]:
    m = meaning.strip()
    if not m:
        return "empty meaning"
    if len(m) < 5:
        return "meaning too short"
    if len(m) > 220:
        return "meaning too long"
    if m.lower() == "unknown":
        return 'model returned "unknown"'
    if any(
        m.lower().startswith(p)
        for p in ("i don't", "i do not", "i cannot", "i can't", "sorry", "unfortunately")
    ):
        return "looks like a refusal"
    if f"means {display_name.lower()}" in m.lower():
        return "tautological meaning"
    return None


def build_cnm_row(
    gap: dict, gpt: dict, model: str, flag_below: float
) -> dict:
    conf_raw = gpt.get("confidence", 0.6)
    try:
        conf = max(0.0, min(1.0, float(conf_raw)))
    except (TypeError, ValueError):
        conf = 0.6
    review_status = "flagged" if conf < flag_below else "auto"
    gscope = gap.get("canonical_gender")
    if gscope not in ("boy", "girl"):
        gscope = "any"
    return {
        "canonical_name_id": gap["canonical_name_id"],
        "meaning": gpt["meaning"].strip(),
        "origin": str(gpt.get("origin", "")).strip(),
        "gender_scope": gscope,
        "meaning_language": "en",
        "meaning_source": f"openai:{model}",
        "meaning_confidence": conf,
        "meaning_verified": False,
        "source_priority": SOURCE_PRIORITY_OPENAI,
        "review_status": review_status,
        "context": {
            "enrichment_stage": "openai",
            "pipeline_version": "openai-en-any-v1-py",
            "normalized_name": gap.get("normalized_name", ""),
            "display_name": gap.get("display_name", ""),
            "gap_row_count": gap.get("row_count", 0),
            "gap_touches_premium": gap.get("touches_premium", False),
            "gap_inverse_rank_weight": round(
                float(gap.get("inverse_rank_weight", 0)), 6
            ),
        },
    }


# ── Per-chunk worker ───────────────────────────────────────────────────────
def process_chunk(
    chunk: list[dict],
    api_key: str,
    model: str,
    flag_below: float,
    out_path: str,
    rejects_path: str,
    print_lock,
) -> tuple[int, int]:
    """Returns (ok_count, rejected_count)."""
    try:
        gpt = call_gpt(api_key, model, chunk)
    except Exception as e:
        reason = f"gpt-call-failed: {e}"
        lines = "".join(
            json.dumps(
                {
                    "canonical_name_id": g["canonical_name_id"],
                    "display_name": g["display_name"],
                    "reason": reason,
                }
            )
            + "\n"
            for g in chunk
        )
        with open(rejects_path, "a") as f:
            f.write(lines)
        return 0, len(chunk)

    by_name = {}
    for r in gpt:
        if isinstance(r, dict) and isinstance(r.get("name"), str):
            by_name[r["name"].lower()] = r

    ok_lines: list[str] = []
    rej_lines: list[str] = []
    for i, gap in enumerate(chunk):
        candidate = by_name.get(gap["display_name"].lower())
        if candidate is None and i < len(gpt):
            c = gpt[i]
            if isinstance(c, dict):
                candidate = c
        if not candidate or not isinstance(candidate.get("meaning"), str):
            rej_lines.append(
                json.dumps(
                    {
                        "canonical_name_id": gap["canonical_name_id"],
                        "display_name": gap["display_name"],
                        "reason": "no-matching-gpt-row",
                        "raw": json.dumps(candidate)
                        if candidate is not None
                        else None,
                    }
                )
                + "\n"
            )
            continue
        reason = is_meaning_invalid(candidate["meaning"], gap["display_name"])
        if reason:
            rej_lines.append(
                json.dumps(
                    {
                        "canonical_name_id": gap["canonical_name_id"],
                        "display_name": gap["display_name"],
                        "reason": reason,
                        "raw": candidate["meaning"],
                    }
                )
                + "\n"
            )
            continue
        row = build_cnm_row(gap, candidate, "", flag_below)  # model added in caller
        ok_lines.append(json.dumps(row) + "\n")

    # Atomic-ish appends (Python's open with 'a' is sequential, and we're
    # writing whole lines per chunk so partial writes don't corrupt rows).
    if ok_lines:
        with open(out_path, "a") as f:
            f.write("".join(ok_lines))
    if rej_lines:
        with open(rejects_path, "a") as f:
            f.write("".join(rej_lines))
    return len(ok_lines), len(rej_lines)


# ── Main ───────────────────────────────────────────────────────────────────
def main() -> None:
    args = parse_args()
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print(
            "Missing OPENAI_API_KEY. Add it to .env.scripts and run "
            "'set -a; source .env.scripts; set +a' before invoking.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(
        f"[enrichmentFromOpenAI.py] in={args.in_path} out={args.out_path} "
        f"model={args.model} chunk={args.chunk_size} concurrency={args.concurrency}"
    )

    Path(args.out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.rejects_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_path).touch()
    Path(args.rejects_path).touch()

    gaps = load_gap_queue(args.in_path)
    print(f"[enrichmentFromOpenAI.py] loaded {len(gaps)} gap rows")

    pending = gaps
    if args.resume:
        done = read_done_ids(args.out_path)
        pending = [g for g in gaps if g["canonical_name_id"] not in done]
        print(
            f"[enrichmentFromOpenAI.py] resume — skipping {len(done)} already-done; "
            f"{len(pending)} remaining"
        )
    if args.limit > 0:
        pending = pending[: args.limit]
        print(f"[enrichmentFromOpenAI.py] --limit={args.limit} applied")

    # High-impact rows first
    pending.sort(
        key=lambda g: (
            -float(g.get("inverse_rank_weight", 0)),
            -int(g.get("row_count", 0)),
        )
    )

    chunks: list[list[dict]] = [
        pending[i : i + args.chunk_size]
        for i in range(0, len(pending), args.chunk_size)
    ]
    print(
        f"[enrichmentFromOpenAI.py] {len(chunks)} chunks of up to {args.chunk_size} names"
    )

    started = time.time()
    ok_total = 0
    rej_total = 0
    done_chunks = 0
    print_lock = None

    def wrapped_process(chunk: list[dict]) -> tuple[int, int]:
        # Inline the model into build_cnm_row by re-binding through a closure.
        ok_lines: list[str] = []
        rej_lines: list[str] = []
        try:
            gpt = call_gpt(api_key, args.model, chunk)
        except Exception as e:
            reason = f"gpt-call-failed: {e}"
            with open(args.rejects_path, "a") as f:
                for g in chunk:
                    f.write(
                        json.dumps(
                            {
                                "canonical_name_id": g["canonical_name_id"],
                                "display_name": g["display_name"],
                                "reason": reason,
                            }
                        )
                        + "\n"
                    )
            return 0, len(chunk)

        by_name = {}
        for r in gpt:
            if isinstance(r, dict) and isinstance(r.get("name"), str):
                by_name[r["name"].lower()] = r

        for i, gap in enumerate(chunk):
            candidate = by_name.get(gap["display_name"].lower())
            if candidate is None and i < len(gpt) and isinstance(gpt[i], dict):
                candidate = gpt[i]
            if not candidate or not isinstance(candidate.get("meaning"), str):
                rej_lines.append(
                    json.dumps(
                        {
                            "canonical_name_id": gap["canonical_name_id"],
                            "display_name": gap["display_name"],
                            "reason": "no-matching-gpt-row",
                        }
                    )
                    + "\n"
                )
                continue
            reason = is_meaning_invalid(candidate["meaning"], gap["display_name"])
            if reason:
                rej_lines.append(
                    json.dumps(
                        {
                            "canonical_name_id": gap["canonical_name_id"],
                            "display_name": gap["display_name"],
                            "reason": reason,
                            "raw": candidate["meaning"],
                        }
                    )
                    + "\n"
                )
                continue
            row = build_cnm_row(gap, candidate, args.model, args.flag_below)
            ok_lines.append(json.dumps(row) + "\n")

        if ok_lines:
            with open(args.out_path, "a") as f:
                f.write("".join(ok_lines))
        if rej_lines:
            with open(args.rejects_path, "a") as f:
                f.write("".join(rej_lines))
        return len(ok_lines), len(rej_lines)

    with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(wrapped_process, c) for c in chunks]
        for fut in cf.as_completed(futures):
            ok, rej = fut.result()
            ok_total += ok
            rej_total += rej
            done_chunks += 1
            if done_chunks % 10 == 0 or done_chunks == len(chunks):
                elapsed = max(time.time() - started, 0.1)
                print(
                    f"[enrichmentFromOpenAI.py] chunks={done_chunks}/{len(chunks)} "
                    f"ok={ok_total} rejected={rej_total} "
                    f"rate={ok_total/elapsed:.1f}/s"
                )

    elapsed = time.time() - started
    print(
        f"\n[enrichmentFromOpenAI.py] done. "
        f"{done_chunks} chunks processed in {elapsed:.1f}s."
    )
    print(f"  ok rows written:   {ok_total}  → {args.out_path}")
    print(f"  rejected rows:     {rej_total}  → {args.rejects_path}")
    print(
        f"\nNext step:\n"
        f"  npm run enrich:apply:dry-run -- --in {args.out_path}\n"
        f"  npm run enrich:apply -- --in {args.out_path} "
        f"--batch-size 500 --concurrency 4"
    )


if __name__ == "__main__":
    main()
