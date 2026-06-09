/**
 * Build a Wikidata-derived dictionary of given-name meanings.
 *
 * Pulls items typed as Q11879590 (female), Q12308941 (male), or Q3409032
 * (unisex) given names from the Wikidata Query Service. Rows are emitted
 * **only** when Wikidata exposes etymology/meaning signal via structured
 * properties (P138 named after, P460 same as, P407 language with a known
 * etymological mapping) or an English description that passes strict
 * etymological (non-boilerplate) filters.
 *
 * Generic Wikidata descriptions such as "male given name", "female given
 * name", "compound given name", or "Japanese kana given name" are **never**
 * used as meanings.
 *
 * Output is JSONL conforming to `DictionaryJsonlRow` from
 * `scripts/lib/meaningEnrichmentJsonl.ts`; `enrichmentFromDictionary.ts`
 * picks it up out of `scripts/data/dictionaries/*.jsonl` and joins it
 * against the gap-finder queue to produce CNM enrichment rows.
 *
 * Licensing
 * ─────────
 * The Wikidata database is CC0 — no attribution required. We still store
 * `source_url`, `wikidata_qid`, and `license: 'CC0'` in the row's `context`
 * so future legal/audit reviews can reconstruct provenance from any CNM row.
 * Individual etymological facts ("Daniel = God is my judge in Hebrew") are
 * uncopyrightable facts under Feist; the CC0 license is belt-and-suspenders.
 *
 * Coverage caveat
 * ───────────────
 * Most given-name items only have boilerplate descriptions. Expect a much
 * lower yield than description-only builders; names without structured
 * etymology fall through to the LLM stage of the pipeline.
 *
 * Wikidata politeness
 * ───────────────────
 * The Query Service requires a User-Agent identifying the operator and a
 * contact channel. The `--contact` flag is mandatory and must be a real
 * email address — Wikidata may block requests from anonymous scripts.
 * Between paginated queries we sleep `--delay-ms` (default 500ms) to stay
 * well under the soft rate limit.
 *
 * Idempotency
 * ───────────
 * Output rows are sorted deterministically by (normalized_name,
 * gender_scope) and deduped against in-batch overlap. Two runs against an
 * unchanged Wikidata snapshot produce byte-identical files (modulo the
 * `context.fetched_at` timestamp, which is intentionally per-run for audit).
 *
 * Usage
 * ─────
 *   tsx scripts/buildWikidataDictionary.ts \
 *     --out scripts/data/dictionaries/wikidata.jsonl \
 *     --max-total 50000 \
 *     --batch-size 5000 \
 *     --contact daan@example.com
 *
 *   tsx scripts/buildWikidataDictionary.ts \
 *     --contact daan@example.com \
 *     --max-batches 1   # smoke test, ~5k rows
 */
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const DEFAULT_OUT = 'scripts/data/dictionaries/wikidata.jsonl';
const DEFAULT_BATCH_SIZE = 5_000;
const MAX_BATCH_SIZE = 10_000;
const DEFAULT_MAX_TOTAL = 50_000;
const DEFAULT_DELAY_MS = 500;
const DEFAULT_RETRY_BACKOFF_MS = 3_000;
const MAX_RETRIES_PER_BATCH = 3;
const MIN_ETYMOLOGICAL_DESCRIPTION_CHARS = 8;
const GENERIC_DESCRIPTION_REPORT_LIMIT = 20;

// Wikidata canonical entity URIs for the three given-name classes.
const GENDER_CLASS_GIRL = 'http://www.wikidata.org/entity/Q11879590';
const GENDER_CLASS_BOY = 'http://www.wikidata.org/entity/Q12308941';
const GENDER_CLASS_NEUTRAL = 'http://www.wikidata.org/entity/Q3409032';

const GENDER_CLASS_TO_SCOPE: Record<string, 'girl' | 'boy' | 'neutral'> = {
  [GENDER_CLASS_GIRL]: 'girl',
  [GENDER_CLASS_BOY]: 'boy',
  [GENDER_CLASS_NEUTRAL]: 'neutral',
};

/**
 * P407 (language of work or name) QIDs mapped to concise etymological origin
 * labels. Only languages in this map may produce a meaning from P407 alone.
 *
 * Pruned 2026-06-09 after smoke-test evidence
 * ─────────────────────────────────────────────
 * Wikidata's P407 is "language of work or name", which for given-name items
 * can mean either "language of origin" OR "language the name is currently
 * used in" — and on a non-trivial fraction of items it's outright wrong
 * (the first 500-item batch produced 8 rows labelling Indonesian female
 * names — Afgansyah, Andriani, Cessy, Jelita, Meliana, Oxavia, Sherina,
 * Terryana — as "Old Norse name", because someone tagged those items with
 * Q9240 on Wikidata).
 *
 * Rule for what stays in the map:
 *   "Could a name tagged with this Q-ID plausibly NOT be from this
 *    language?" If no (i.e. the language is dead-tradition with no
 *    modern speakers and no risk of conflating current-usage with origin),
 *    keep it. If yes, drop it — let the LLM stage produce a better meaning
 *    than a confident-wrong language label.
 *
 * Kept (high-confidence ancient / classical etymological tags):
 *   Q9288   Hebrew              — Hebrew names are almost always Hebrew-origin
 *   Q13955  Arabic              — same: Arabic origin
 *   Q397    Latin               — dead, no current-usage confusion
 *   Q35497  Ancient Greek       — dead
 *   Q11059  Sanskrit            — dead-tradition; well-tagged on Wikidata
 *   Q28602  Aramaic             — dead
 *   Q37068  Coptic              — liturgical only
 *   Q33831  Phoenician          — dead
 *   Q36790  Akkadian            — dead
 *   Q25285  Proto-Indo-European — by definition, etymological
 *
 * Dropped (modern descendants exist OR observed quality issues):
 *   Q9129   Greek (modern)         — conflates modern-usage with origin
 *   Q44979  Old English            — observed misapplication; modern English
 *                                    names often tagged here without origin
 *   Q9240   Old Norse              — the Indonesian-name vandalism source
 *   Q9168   Persian                — modern speakers; conflation risk
 *   Q9142   Irish                  — same
 *   Q9301   Welsh                  — same
 *   Q330666 Scottish Gaelic        — same
 *   Q8641   Old Church Slavonic    — liturgical; modern Slavic conflation
 *
 * Effect on yield: ~9 % of dictionary rows came from P407 in the smoke test,
 * of which ~42 % were wrong. Pruning roughly halves the P407 row count and
 * removes most of the wrong rows. The dropped names fall through to the LLM
 * stage where they have a chance of a correct meaning rather than a
 * confidently-wrong language label.
 */
const ETYMOLOGIC_LANGUAGE_QID_TO_ORIGIN: Record<string, string> = {
  Q9288: 'Hebrew',
  Q13955: 'Arabic',
  Q397: 'Latin',
  Q35497: 'Ancient Greek',
  Q11059: 'Sanskrit',
  Q28602: 'Aramaic',
  Q37068: 'Coptic',
  Q33831: 'Phoenician',
  Q36790: 'Akkadian',
  Q25285: 'Proto-Indo-European',
};

/**
 * Regexes for Wikidata boilerplate descriptions that carry no etymology.
 * Order matters: first match wins for reporting.
 */
const GENERIC_DESCRIPTION_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'japanese_kana_given_name', re: /^(undifferentiated )?japanese kana (male |female )?given name\b/i },
  { id: 'japanese_given_name_script', re: /^japanese (male |female )?given name \([^)]+\)$/i },
  { id: 'compound_given_name', re: /^(male |female |unisex )?compound given name\b/i },
  { id: 'gender_given_name_script', re: /^(male|female|unisex) given name \([^)]+\)$/i },
  { id: 'gender_given_name', re: /^(male|female|unisex) given name\b/i },
  { id: 'language_gender_first_name', re: /^[a-z][a-z -]{0,40} (masculine|feminine) (first |given )?name$/i },
  { id: 'given_name', re: /^given name\b/i },
  { id: 'first_name', re: /^first name\b/i },
  { id: 'forename', re: /^forename\b/i },
  { id: 'personal_name', re: /^personal name$/i },
  { id: 'baby_name', re: /^baby name$/i },
  { id: 'name', re: /^name$/i },
];

// ── CLI ─────────────────────────────────────────────────────────────────────

type Cli = {
  outPath: string;
  batchSize: number;
  maxTotal: number;
  maxBatches: number | null;
  contact: string;
  delayMs: number;
};

function parseArgs(argv: string[]): Cli {
  const outIdx = argv.indexOf('--out');
  const outPath = outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT;

  const batchIdx = argv.indexOf('--batch-size');
  const batchSize =
    batchIdx >= 0 ? Number(argv[batchIdx + 1]) : DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new Error(
      `--batch-size must be an integer 1..${MAX_BATCH_SIZE}; got ${argv[batchIdx + 1]}`,
    );
  }

  const maxIdx = argv.indexOf('--max-total');
  const maxTotal = maxIdx >= 0 ? Number(argv[maxIdx + 1]) : DEFAULT_MAX_TOTAL;
  if (!Number.isInteger(maxTotal) || maxTotal < 1) {
    throw new Error(`--max-total must be a positive integer; got ${argv[maxIdx + 1]}`);
  }

  const maxBatchesIdx = argv.indexOf('--max-batches');
  const maxBatches =
    maxBatchesIdx >= 0 && argv[maxBatchesIdx + 1]
      ? Number(argv[maxBatchesIdx + 1])
      : null;
  if (maxBatches !== null && (!Number.isInteger(maxBatches) || maxBatches < 1)) {
    throw new Error(
      `--max-batches must be a positive integer; got ${argv[maxBatchesIdx + 1]}`,
    );
  }

  const contactIdx = argv.indexOf('--contact');
  const contact = contactIdx >= 0 ? String(argv[contactIdx + 1] ?? '').trim() : '';
  if (!contact || !contact.includes('@')) {
    throw new Error(
      'Missing or invalid --contact <email>. Wikidata Query Service requires a contact email in the User-Agent.',
    );
  }

  const delayIdx = argv.indexOf('--delay-ms');
  const delayMs = delayIdx >= 0 ? Number(argv[delayIdx + 1]) : DEFAULT_DELAY_MS;
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60_000) {
    throw new Error(`--delay-ms must be 0..60000; got ${argv[delayIdx + 1]}`);
  }

  return { outPath, batchSize, maxTotal, maxBatches, contact, delayMs };
}

// ── SPARQL ──────────────────────────────────────────────────────────────────

/**
 * Paginated batch over the three given-name classes with optional etymology
 * properties: P138 (named after), P407 (language of name), P460 (same as).
 */
function buildSparqlQuery(offset: number, limit: number): string {
  return [
    'SELECT ?item ?itemLabel ?itemDescription ?genderClass ?namedAfter ?namedAfterLabel ?nameLanguage ?nameLanguageLabel ?sameAs ?sameAsLabel WHERE {',
    '  {',
    '    SELECT ?item ?genderClass WHERE {',
    '      VALUES ?genderClass {',
    `        <${GENDER_CLASS_GIRL}>`,
    `        <${GENDER_CLASS_BOY}>`,
    `        <${GENDER_CLASS_NEUTRAL}>`,
    '      } .',
    '      ?item wdt:P31 ?genderClass .',
    '    }',
    '    ORDER BY ?item',
    `    LIMIT ${limit}`,
    `    OFFSET ${offset}`,
    '  }',
    '  OPTIONAL { ?item wdt:P138 ?namedAfter . }',
    '  OPTIONAL { ?item wdt:P407 ?nameLanguage . }',
    '  OPTIONAL { ?item wdt:P460 ?sameAs . }',
    '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }',
    '}',
    'ORDER BY ?item',
  ].join('\n');
}

type WikidataBinding = {
  item?: { value: string };
  itemLabel?: { value: string };
  itemDescription?: { value: string };
  genderClass?: { value: string };
  namedAfter?: { value: string };
  namedAfterLabel?: { value: string };
  nameLanguage?: { value: string };
  nameLanguageLabel?: { value: string };
  sameAs?: { value: string };
  sameAsLabel?: { value: string };
};

type WikidataResponse = {
  results?: {
    bindings?: WikidataBinding[];
  };
};

async function fetchSparqlBatch(
  query: string,
  contact: string,
  retriesLeft: number,
): Promise<WikidataBinding[]> {
  const userAgent = `BabySwipe-dictionary-builder/1.0 (mailto:${contact})`;
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/sparql-results+json',
      },
    });
  } catch (err) {
    if (retriesLeft > 0) {
      const backoffMs = DEFAULT_RETRY_BACKOFF_MS * (MAX_RETRIES_PER_BATCH - retriesLeft + 1);
      console.warn(
        `[buildWikidataDictionary] network error (${err instanceof Error ? err.message : err}); ` +
          `retrying in ${backoffMs}ms (${retriesLeft} left)`,
      );
      await new Promise((r) => setTimeout(r, backoffMs));
      return fetchSparqlBatch(query, contact, retriesLeft - 1);
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if ((res.status === 429 || res.status === 504 || res.status >= 500) && retriesLeft > 0) {
      const backoffMs = DEFAULT_RETRY_BACKOFF_MS * (MAX_RETRIES_PER_BATCH - retriesLeft + 1);
      console.warn(
        `[buildWikidataDictionary] HTTP ${res.status}; retrying in ${backoffMs}ms ` +
          `(${retriesLeft} left). body=${body.slice(0, 200)}`,
      );
      await new Promise((r) => setTimeout(r, backoffMs));
      return fetchSparqlBatch(query, contact, retriesLeft - 1);
    }
    throw new Error(`Wikidata SPARQL ${res.status}: ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as WikidataResponse;
  return json.results?.bindings ?? [];
}

type DropReason =
  | 'missing_qid'
  | 'unusable_label'
  | 'unknown_gender_class'
  | 'generic_description'
  | 'disambiguation_description'
  | 'no_etymology_signal';

type MeaningDerivation =
  | 'P138_named_after'
  | 'P460_same_as'
  | 'P407_language'
  | 'etymological_description';

type BatchStats = {
  fetched: number;
  items: number;
  kept: number;
  dropped: Record<DropReason, number>;
};

function emptyDropCounts(): Record<DropReason, number> {
  return {
    missing_qid: 0,
    unusable_label: 0,
    unknown_gender_class: 0,
    generic_description: 0,
    disambiguation_description: 0,
    no_etymology_signal: 0,
  };
}

function mergeDropCounts(
  into: Record<DropReason, number>,
  from: Record<DropReason, number>,
): void {
  for (const key of Object.keys(from) as DropReason[]) {
    into[key] += from[key]!;
  }
}

function totalDropped(dropped: Record<DropReason, number>): number {
  return Object.values(dropped).reduce((sum, n) => sum + n, 0);
}

function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ');
}

function isLabelUsable(label: string): boolean {
  if (!label) return false;
  if (/^Q\d+$/i.test(label)) return false;
  if (label.includes(' (')) return false;
  if (label.length > 60) return false;
  if (label.split(/\s+/).length > 4) return false;
  return true;
}

function qidFromUri(uri: string | undefined): string {
  if (!uri) return '';
  const m = uri.match(/Q\d+$/);
  return m ? m[0] : '';
}

function isRelatedLabelUsable(label: string): boolean {
  if (!label || /^Q\d+$/i.test(label)) return false;
  if (label.length > 80) return false;
  return true;
}

type GenericDescriptionMatch = {
  generic: true;
  patternId: string;
} | {
  generic: false;
};

function matchGenericDescription(description: string): GenericDescriptionMatch {
  for (const { id, re } of GENERIC_DESCRIPTION_PATTERNS) {
    if (re.test(description)) return { generic: true, patternId: id };
  }
  return { generic: false };
}

function isEtymologicalDescription(description: string): boolean {
  const trimmed = description.trim();
  if (trimmed.length < MIN_ETYMOLOGICAL_DESCRIPTION_CHARS) return false;
  if (matchGenericDescription(trimmed).generic) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('disambiguation')) return false;

  return (
    /\bmeaning\b/.test(lower) ||
    /\bmeans\b/.test(lower) ||
    /\bderived from\b/.test(lower) ||
    /\bfrom the (?:hebrew|arabic|greek|latin|persian|irish|welsh|german|french|spanish|italian|slavic|norwegian|danish|swedish|english|japanese|chinese|korean|russian|sanskrit|aramaic|coptic|turkish|armenian|georgian|hindi|tamil|malay|indonesian|thai|vietnamese|polish|czech|hungarian|romanian|bulgarian|ukrainian|finnish|estonian|latvian|lithuanian|icelandic|basque|catalan|portuguese|dutch|scandinavian)\b/.test(
      lower,
    ) ||
    /\bform of\b/.test(lower) ||
    /\bdiminutive of\b/.test(lower) ||
    /\bvariant of\b/.test(lower) ||
    /\bshort form of\b/.test(lower) ||
    /\bpet form of\b/.test(lower) ||
    /\b(?:feminine|masculine) form of\b/.test(lower) ||
    /\b(?:anglicized|latinized|germanized|frenchified) form of\b/.test(lower) ||
    /\bname of\b/.test(lower) ||
    /\borigin(?:ally)?\b/.test(lower) ||
    /\btransliteration of\b/.test(lower)
  );
}

type ItemAggregate = {
  itemUri: string;
  label: string;
  description: string;
  genderClass: string;
  namedAfterLabels: string[];
  nameLanguageQid: string | null;
  nameLanguageLabel: string | null;
  sameAsLabels: string[];
};

function aggregateBindings(bindings: WikidataBinding[]): ItemAggregate[] {
  const byItem = new Map<string, ItemAggregate>();

  for (const b of bindings) {
    const itemUri = b.item?.value ?? '';
    if (!itemUri) continue;

    let agg = byItem.get(itemUri);
    if (!agg) {
      agg = {
        itemUri,
        label: b.itemLabel?.value?.trim() ?? '',
        description: b.itemDescription?.value?.trim() ?? '',
        genderClass: b.genderClass?.value ?? '',
        namedAfterLabels: [],
        nameLanguageQid: null,
        nameLanguageLabel: null,
        sameAsLabels: [],
      };
      byItem.set(itemUri, agg);
    }

    const namedAfterLabel = b.namedAfterLabel?.value?.trim() ?? '';
    if (isRelatedLabelUsable(namedAfterLabel) && !agg.namedAfterLabels.includes(namedAfterLabel)) {
      agg.namedAfterLabels.push(namedAfterLabel);
    }

    const sameAsLabel = b.sameAsLabel?.value?.trim() ?? '';
    if (isRelatedLabelUsable(sameAsLabel) && !agg.sameAsLabels.includes(sameAsLabel)) {
      agg.sameAsLabels.push(sameAsLabel);
    }

    const langQid = qidFromUri(b.nameLanguage?.value);
    if (langQid && !agg.nameLanguageQid) {
      agg.nameLanguageQid = langQid;
      agg.nameLanguageLabel = b.nameLanguageLabel?.value?.trim() ?? null;
    }
  }

  return Array.from(byItem.values());
}

type MeaningCandidate = {
  meaning: string;
  derivation: MeaningDerivation;
  wikidata_property?: string;
};

function buildMeaningFromAggregate(agg: ItemAggregate): MeaningCandidate | null {
  if (agg.namedAfterLabels.length > 0) {
    return {
      meaning: `Named after ${agg.namedAfterLabels[0]}`,
      derivation: 'P138_named_after',
      wikidata_property: 'P138',
    };
  }

  if (agg.sameAsLabels.length > 0) {
    return {
      meaning: `Variant of ${agg.sameAsLabels[0]}`,
      derivation: 'P460_same_as',
      wikidata_property: 'P460',
    };
  }

  if (agg.nameLanguageQid) {
    const origin = ETYMOLOGIC_LANGUAGE_QID_TO_ORIGIN[agg.nameLanguageQid];
    if (origin) {
      return {
        meaning: `${origin} name`,
        derivation: 'P407_language',
        wikidata_property: 'P407',
      };
    }
  }

  if (agg.description && isEtymologicalDescription(agg.description)) {
    return {
      meaning: agg.description,
      derivation: 'etymological_description',
    };
  }

  return null;
}

type DictRow = {
  normalized_name: string;
  meaning: string;
  gender_scope: 'girl' | 'boy' | 'neutral';
  meaning_language: 'en';
  meaning_source: string;
  meaning_confidence: number;
  meaning_verified: boolean;
  source_priority: number;
  review_status: 'auto';
  context: Record<string, unknown>;
};

function describeDropReason(reason: DropReason): string {
  switch (reason) {
    case 'missing_qid':
      return 'missing Wikidata QID on item URI';
    case 'unusable_label':
      return 'label missing, is QID, disambiguated, too long, or too many words';
    case 'unknown_gender_class':
      return 'gender class not girl/boy/neutral';
    case 'generic_description':
      return 'description is generic given-name boilerplate (no structured etymology either)';
    case 'disambiguation_description':
      return 'description mentions disambiguation';
    case 'no_etymology_signal':
      return 'no P138/P460/P407 mapping and description lacks etymological content';
  }
}

type AggregateProcessResult =
  | { row: DictRow }
  | { drop: DropReason; genericDescription?: string; genericPatternId?: string };

function aggregateToRow(
  agg: ItemAggregate,
  runStartedAtIso: string,
): AggregateProcessResult {
  if (!isLabelUsable(agg.label)) return { drop: 'unusable_label' };

  const scope = GENDER_CLASS_TO_SCOPE[agg.genderClass];
  if (!scope) return { drop: 'unknown_gender_class' };

  const qid = qidFromUri(agg.itemUri);
  if (!qid) return { drop: 'missing_qid' };

  const meaningCandidate = buildMeaningFromAggregate(agg);
  if (meaningCandidate) {
    return {
      row: {
        normalized_name: normalizeNameKey(agg.label),
        meaning: meaningCandidate.meaning,
        gender_scope: scope,
        meaning_language: 'en',
        meaning_source: 'external:wikidata',
        meaning_confidence: 0.75,
        meaning_verified: false,
        source_priority: 3,
        review_status: 'auto',
        context: {
          wikidata_qid: qid,
          source_url: `https://www.wikidata.org/wiki/${qid}`,
          license: 'CC0',
          attribution_required: false,
          display_name: agg.label,
          meaning_derivation: meaningCandidate.derivation,
          ...(meaningCandidate.wikidata_property
            ? { wikidata_property: meaningCandidate.wikidata_property }
            : {}),
          fetched_at: runStartedAtIso,
        },
      },
    };
  }

  if (agg.description) {
    const lower = agg.description.toLowerCase();
    if (lower.includes('disambiguation')) return { drop: 'disambiguation_description' };

    const generic = matchGenericDescription(agg.description);
    if (generic.generic) {
      return {
        drop: 'generic_description',
        genericDescription: agg.description,
        genericPatternId: generic.patternId,
      };
    }
  }

  return { drop: 'no_etymology_signal' };
}

function processBindings(
  bindings: WikidataBinding[],
  runStartedAtIso: string,
  collected: DictRow[],
  droppedGenericDescriptions: Map<string, number>,
  droppedGenericPatterns: Map<string, number>,
): BatchStats {
  const aggregates = aggregateBindings(bindings);
  const stats: BatchStats = {
    fetched: bindings.length,
    items: aggregates.length,
    kept: 0,
    dropped: emptyDropCounts(),
  };

  for (const agg of aggregates) {
    const result = aggregateToRow(agg, runStartedAtIso);
    if ('row' in result) {
      collected.push(result.row);
      stats.kept += 1;
    } else {
      stats.dropped[result.drop] += 1;
      if (result.drop === 'generic_description' && result.genericDescription) {
        droppedGenericDescriptions.set(
          result.genericDescription,
          (droppedGenericDescriptions.get(result.genericDescription) ?? 0) + 1,
        );
        if (result.genericPatternId) {
          droppedGenericPatterns.set(
            result.genericPatternId,
            (droppedGenericPatterns.get(result.genericPatternId) ?? 0) + 1,
          );
        }
      }
    }
  }

  return stats;
}

function formatDropSummary(dropped: Record<DropReason, number>): string {
  const lines = (Object.keys(dropped) as DropReason[])
    .filter((reason) => dropped[reason]! > 0)
    .sort((a, b) => dropped[b]! - dropped[a]! || a.localeCompare(b))
    .map((reason) => `    ${reason} = ${dropped[reason]} (${describeDropReason(reason)})`);
  return lines.length > 0 ? lines.join('\n') : '    (none)';
}

function formatGenericDescriptionReport(
  byDescription: Map<string, number>,
  byPattern: Map<string, number>,
): string {
  const patternLines = [...byPattern.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([patternId, count]) => `    ${patternId} = ${count}`);
  const sampleLines = [...byDescription.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, GENERIC_DESCRIPTION_REPORT_LIMIT)
    .map(([desc, count]) => `    ${count}\t${JSON.stringify(desc)}`);

  const parts: string[] = [];
  parts.push('  dropped generic descriptions by pattern:');
  parts.push(patternLines.length > 0 ? patternLines.join('\n') : '    (none)');
  parts.push(`  dropped generic description samples (top ${GENERIC_DESCRIPTION_REPORT_LIMIT}):`);
  parts.push(sampleLines.length > 0 ? sampleLines.join('\n') : '    (none)');
  return parts.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const runStartedAtIso = new Date().toISOString();
  const outPath = path.isAbsolute(cli.outPath)
    ? cli.outPath
    : path.join(process.cwd(), cli.outPath);

  console.log(
    `[buildWikidataDictionary] out=${outPath} batch_size=${cli.batchSize} max_total=${cli.maxTotal}` +
      (cli.maxBatches !== null ? ` max_batches=${cli.maxBatches}` : '') +
      ` delay_ms=${cli.delayMs}`,
  );

  const collected: DictRow[] = [];
  let offset = 0;
  let batches = 0;
  let totalFetched = 0;
  let totalItems = 0;
  let totalKept = 0;
  const totalDroppedByReason = emptyDropCounts();
  const droppedGenericDescriptions = new Map<string, number>();
  const droppedGenericPatterns = new Map<string, number>();

  while (offset < cli.maxTotal) {
    if (cli.maxBatches !== null && batches >= cli.maxBatches) {
      console.log(
        `[buildWikidataDictionary] --max-batches=${cli.maxBatches} reached; stopping early.`,
      );
      break;
    }

    const limit = Math.min(cli.batchSize, cli.maxTotal - offset);
    const query = buildSparqlQuery(offset, limit);
    const batchStart = Date.now();
    console.log(
      `[buildWikidataDictionary] batch ${batches + 1}: offset=${offset} limit=${limit} — querying Wikidata…`,
    );

    const bindings = await fetchSparqlBatch(query, cli.contact, MAX_RETRIES_PER_BATCH);
    const batchStats = processBindings(
      bindings,
      runStartedAtIso,
      collected,
      droppedGenericDescriptions,
      droppedGenericPatterns,
    );

    totalFetched += batchStats.fetched;
    totalItems += batchStats.items;
    totalKept += batchStats.kept;
    mergeDropCounts(totalDroppedByReason, batchStats.dropped);

    const elapsedMs = Date.now() - batchStart;
    console.log(
      `  → bindings=${batchStats.fetched} items=${batchStats.items} kept=${batchStats.kept} dropped=${totalDropped(batchStats.dropped)} elapsed=${elapsedMs}ms`,
    );

    if (bindings.length === 0) {
      console.log(
        '[buildWikidataDictionary] empty page returned — Wikidata catalog exhausted.',
      );
      break;
    }
    if (batchStats.items < limit) {
      offset += batchStats.items;
      batches += 1;
      break;
    }

    offset += limit;
    batches += 1;
    if (cli.delayMs > 0) {
      await new Promise((r) => setTimeout(r, cli.delayMs));
    }
  }

  const byKey = new Map<string, DictRow>();
  for (const row of collected) {
    const key = `${row.normalized_name}|${row.gender_scope}`;
    if (!byKey.has(key)) byKey.set(key, row);
  }
  const final = Array.from(byKey.values()).sort((a, b) => {
    if (a.normalized_name !== b.normalized_name) {
      return a.normalized_name.localeCompare(b.normalized_name);
    }
    return a.gender_scope.localeCompare(b.gender_scope);
  });

  mkdirSync(path.dirname(outPath), { recursive: true });
  const body = final.map((r) => JSON.stringify(r)).join('\n');
  writeFileSync(outPath, body.length > 0 ? `${body}\n` : '', 'utf8');

  const dedupeDropped = collected.length - final.length;
  const totalFilteredDropped = totalDropped(totalDroppedByReason);

  console.log('[buildWikidataDictionary] summary');
  console.log(`  output_path        = ${outPath}`);
  console.log(`  batches            = ${batches}`);
  console.log(`  bindings_fetched   = ${totalFetched}`);
  console.log(`  distinct_items     = ${totalItems}`);
  console.log(`  kept (post-filter) = ${totalKept}`);
  console.log(`  dropped (filtered) = ${totalFilteredDropped}`);
  console.log('  dropped by reason:');
  console.log(formatDropSummary(totalDroppedByReason));
  console.log(formatGenericDescriptionReport(droppedGenericDescriptions, droppedGenericPatterns));
  console.log(`  dedupe dropped     = ${dedupeDropped}`);
  console.log(`  written            = ${final.length}`);

  if (final.length === 0) {
    console.error(
      '[buildWikidataDictionary] WARNING: kept=0 — no dictionary rows written. ' +
        'Wikidata returned items but none had structured etymology or etymological descriptions. ' +
        'Inspect dropped-by-reason counts and generic-description samples above.',
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
