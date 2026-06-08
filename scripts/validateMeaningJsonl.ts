/**
 * Validate CNM-shaped meaning-enrichment JSONL.
 *
 * Invalid rows are written to a sibling `.rejects.jsonl` file.
 * No database writes.
 *
 * Usage:
 *   tsx scripts/validateMeaningJsonl.ts scripts/data/meaning-enrichment/dictionary-en-any.jsonl
 *   tsx scripts/validateMeaningJsonl.ts --rejects-out /tmp/rejects.jsonl file.jsonl
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  defaultRejectsPath,
  readJsonlRecords,
  serializeMeaningReject,
  validateCnmEnrichmentRow,
  type MeaningJsonlReject,
} from './lib/meaningEnrichmentJsonl';

type Cli = {
  files: string[];
  rejectsOut: string | null;
};

function parseArgs(argv: string[]): Cli {
  const rejectsIdx = argv.indexOf('--rejects-out');
  const rejectsOut =
    rejectsIdx >= 0 && argv[rejectsIdx + 1] ? argv[rejectsIdx + 1] : null;

  const files = argv.filter((arg, idx, all) => {
    if (arg === '--rejects-out') return false;
    if (idx > 0 && all[idx - 1] === '--rejects-out') return false;
    return true;
  });

  if (files.length === 0) {
    throw new Error(
      'Usage: tsx scripts/validateMeaningJsonl.ts [--rejects-out path] <file.jsonl...>',
    );
  }

  return { files, rejectsOut };
}

function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));

  let totalRows = 0;
  let totalValid = 0;
  let totalRejected = 0;
  const allRejects: MeaningJsonlReject[] = [];

  for (const file of cli.files) {
    const resolved = resolvePath(file);
    const records = readJsonlRecords(resolved);
    let fileValid = 0;
    let fileRejected = 0;

    for (const { row, line } of records) {
      totalRows += 1;
      const result = validateCnmEnrichmentRow(row);
      if (result.ok) {
        totalValid += 1;
        fileValid += 1;
      } else {
        totalRejected += 1;
        fileRejected += 1;
        allRejects.push({
          line,
          source: file,
          errors: result.errors,
          row,
        });
      }
    }

    console.log(
      `[validateMeaningJsonl] ${file}: rows=${records.length} valid=${fileValid} rejected=${fileRejected}`,
    );
  }

  if (allRejects.length > 0) {
    const rejectsPath = cli.rejectsOut
      ? resolvePath(cli.rejectsOut)
      : cli.files.length === 1
        ? resolvePath(defaultRejectsPath(cli.files[0]!))
        : resolvePath('scripts/data/meaning-enrichment/validation.rejects.jsonl');

    mkdirSync(path.dirname(rejectsPath), { recursive: true });
    writeFileSync(
      rejectsPath,
      `${allRejects.map(serializeMeaningReject).join('\n')}\n`,
      'utf8',
    );
    console.error(
      `[validateMeaningJsonl] rejected=${totalRejected} → ${rejectsPath}`,
    );
    process.exit(1);
  }

  console.log(`[validateMeaningJsonl] ok rows=${totalRows} valid=${totalValid}`);
}

main();
