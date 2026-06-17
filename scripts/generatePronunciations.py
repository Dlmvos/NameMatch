#!/usr/bin/env python3
"""
Bundled-name pronunciation backfill.

Reads bundled names from src/data/names.ts, finds the ones not already
in ENRICHMENT_MAP (src/services/nameEnrichment.ts), asks OpenAI for
English respellings (capital STRESS, hyphens between syllables), and
writes the result to src/data/pronunciationBackfill.json.

The runtime nameEnrichment.enrichName() reads from BOTH the curated
ENRICHMENT_MAP and this generated backfill — curated wins when both
exist, backfill fills the gap when curated lacks a pronunciation.

Run:
    OPENAI_API_KEY=sk-... python3 scripts/generatePronunciations.py

Idempotent: rerunning skips names already in the output file.
Resume-safe: writes after every batch, so a crash mid-run only loses
the in-flight batch.

Cost ballpark: ~500 missing names * ~30 tokens out * gpt-4o-mini
pricing = under $0.05 total. Runtime: ~2-3 minutes.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
NAMES_FILE = REPO_ROOT / "src" / "data" / "names.ts"
ENRICHMENT_FILE = REPO_ROOT / "src" / "services" / "nameEnrichment.ts"
OUTPUT_FILE = REPO_ROOT / "src" / "data" / "pronunciationBackfill.json"

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"
BATCH_SIZE = 40
SLEEP_BETWEEN_BATCHES_S = 0.5


def parse_bundled_names() -> list[str]:
    """Extract every `name: 'X'` literal from names.ts. Returns a
    deduplicated list (some names appear in multiple regions)."""
    text = NAMES_FILE.read_text(encoding="utf-8")
    pattern = re.compile(r"name:\s*['\"]([^'\"]+)['\"]")
    seen: dict[str, None] = {}
    for m in pattern.finditer(text):
        seen.setdefault(m.group(1), None)
    return list(seen.keys())


def parse_existing_pronunciation_keys() -> set[str]:
    """Return the set of name keys in ENRICHMENT_MAP that already have
    a non-empty pronunciation field. Used to skip those names."""
    text = ENRICHMENT_FILE.read_text(encoding="utf-8")
    # Each entry looks roughly like:
    #   Aria:      { popularity_rank: 18, ..., pronunciation: 'AR-ee-ah', ... },
    # or with quoted key: 'Amélie': { ... pronunciation: 'ah-may-LEE', ... },
    # Be permissive on whitespace and key quoting.
    pattern = re.compile(
        r"^\s*['\"]?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' \-]*?)['\"]?\s*:\s*\{[^}]*pronunciation:\s*['\"]([^'\"]+)['\"]",
        re.MULTILINE,
    )
    return {m.group(1) for m in pattern.finditer(text) if m.group(2).strip()}


def load_existing_backfill() -> dict[str, str]:
    if not OUTPUT_FILE.exists():
        return {}
    try:
        return json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"WARNING: {OUTPUT_FILE.name} is not valid JSON, starting fresh")
        return {}


def write_backfill(d: dict[str, str]) -> None:
    OUTPUT_FILE.write_text(
        json.dumps(d, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )


SYSTEM_PROMPT = (
    "You generate English pronunciation respellings for baby names from "
    "various cultures. Follow these rules exactly:\n"
    "- Use uppercase letters for the STRESSED syllable, lowercase elsewhere.\n"
    "- Separate syllables with single hyphens.\n"
    "- Respect the name's origin pronunciation, not the anglicised version "
    "(Italian Lorenzo -> lo-REN-zo, NOT LOR-en-zo; French Antoine -> "
    "an-TWAN; Spanish Lucía -> loo-SEE-ah).\n"
    "- For names with multiple cultural pronunciations, pick the most "
    "common one in the name's origin.\n"
    "- Keep it concise — one pronunciation per name.\n"
    "- Output ONLY a JSON object mapping each input name verbatim to its "
    "pronunciation. No prose, no markdown.\n"
    "Examples: {\"Noah\": \"NOH-ah\", \"Sofia\": \"so-FEE-ah\", "
    "\"Amélie\": \"ah-may-LEE\", \"Lucía\": \"loo-SEE-ah\"}."
)


def call_openai(names_batch: list[str], api_key: str) -> dict[str, str]:
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Names: " + ", ".join(names_batch)},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENAI_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI HTTP {e.code}: {body_text}") from e

    text = payload["choices"][0]["message"]["content"]
    parsed = json.loads(text)
    # Filter to only the requested names (defensively — the model
    # sometimes hallucinates extras under low-quality batches).
    return {k: v for k, v in parsed.items() if k in names_batch and isinstance(v, str) and v.strip()}


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set in environment", file=sys.stderr)
        print("Run: OPENAI_API_KEY=sk-... python3 scripts/generatePronunciations.py", file=sys.stderr)
        return 1

    all_names = parse_bundled_names()
    curated = parse_existing_pronunciation_keys()
    backfill = load_existing_backfill()

    missing = [n for n in all_names if n not in curated and n not in backfill]

    print(f"Bundled names total:         {len(all_names)}")
    print(f"Already curated in MAP:      {len(curated)}")
    print(f"Already in backfill output:  {len(backfill)}")
    print(f"Need to generate this run:   {len(missing)}")

    if not missing:
        print("\nNothing to do. Backfill is already up to date.")
        return 0

    for batch_idx, start in enumerate(range(0, len(missing), BATCH_SIZE), start=1):
        batch = missing[start:start + BATCH_SIZE]
        print(f"\nBatch {batch_idx}: {len(batch)} names ...")
        try:
            got = call_openai(batch, api_key)
        except Exception as e:
            print(f"  FAILED: {e}")
            continue
        backfill.update(got)
        write_backfill(backfill)
        coverage = len(got)
        missing_in_batch = len(batch) - coverage
        print(f"  OK: {coverage}/{len(batch)} written. "
              f"({missing_in_batch} not returned — possibly skipped by model.)")
        time.sleep(SLEEP_BETWEEN_BATCHES_S)

    print(f"\nDone. {len(backfill)} pronunciations in {OUTPUT_FILE.relative_to(REPO_ROOT)}")
    print("Commit the JSON file and rebuild — runtime picks it up automatically.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
