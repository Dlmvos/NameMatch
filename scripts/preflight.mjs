import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const SUPABASE_DIR = path.join(ROOT, 'supabase');
const requireFromHere = createRequire(import.meta.url);

const failures = [];

function logStep(title) {
  console.log(`\n== ${title} ==`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function runCommand(title, command, args, options = {}) {
  logStep(title);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fail(`${title} exited with code ${result.status}`);
    return false;
  }

  pass(`${title} completed`);
  return true;
}

function evalTsModule(filePath, injectedExports = []) {
  const source = fs.readFileSync(filePath, 'utf8');
  const extra = injectedExports.map((name) => `module.exports.${name} = ${name};`).join('\n');
  const transpiled = ts.transpileModule(`${source}\n${extra}\n`, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filePath,
  }).outputText;

  const context = {
    module: { exports: {} },
    exports: {},
    require: requireFromHere,
    console,
    process,
  };
  vm.createContext(context);
  vm.runInContext(transpiled, context, { filename: filePath });
  return context.module.exports;
}

function runI18nAudit() {
  logStep('i18n audit');
  const runtimePath = path.join(SRC, 'i18n', 'runtime.ts');
  const languagePath = path.join(SRC, 'services', 'languageService.ts');

  const runtime = evalTsModule(runtimePath, ['TRANSLATIONS', 'EN']);
  const languageService = evalTsModule(languagePath, ['SUPPORTED_LANGUAGE_OPTIONS']);

  const translations = runtime.TRANSLATIONS;
  const english = runtime.EN;
  const supported = languageService.SUPPORTED_LANGUAGE_OPTIONS.map((opt) => opt.code);
  const criticalKeys = [
    'common.ok',
    'common.error',
    'welcome.cta.start',
    'welcome.cta.login',
    'tab.swipe',
    'tab.matches',
    'tab.shop',
    'tab.settings',
    'preferences.title',
    'country.title',
    'partner.title',
    'shop.title',
    'shop.restorePurchases',
    'shop.purchaseError',
    'shop.purchaseErrorNetwork',
    'shop.purchaseErrorPending',
    'paywall.secondaryCta',
  ];

  if (!translations || !english || !supported?.length) {
    fail('Could not load runtime translations or supported language options.');
    return;
  }

  const baselineKeys = Object.keys(english);
  let hasCriticalMissing = false;

  for (const code of supported) {
    const localeMap = translations[code];
    if (!localeMap) {
      fail(`Missing runtime locale map for "${code}".`);
      hasCriticalMissing = true;
      continue;
    }
    const missingCritical = criticalKeys.filter((key) => !(key in localeMap));
    if (missingCritical.length > 0) {
      fail(`Locale "${code}" is missing critical runtime keys: ${missingCritical.join(', ')}`);
      hasCriticalMissing = true;
      continue;
    }
    const missingKeys = baselineKeys.filter((key) => !(key in localeMap));
    if (missingKeys.length > 0) {
      console.warn(
        `WARN: Locale "${code}" falls back to EN for ${missingKeys.length} non-critical keys. First few: ${missingKeys.slice(0, 5).join(', ')}`,
      );
    }
  }

  if (!hasCriticalMissing) {
    pass(`All ${supported.length} supported locales include the ${criticalKeys.length} critical runtime keys.`);
  }
}

function runMigrationChecks() {
  logStep('migration checks');
  const migrationsDir = path.join(SUPABASE_DIR, 'migrations');
  const postChecksPath = path.join(SUPABASE_DIR, 'checks', 'post_migration_checks.sql');
  const schemaPath = path.join(SUPABASE_DIR, 'schema.sql');

  if (!fs.existsSync(migrationsDir)) {
    fail('supabase/migrations is missing.');
    return;
  }
  if (!fs.existsSync(postChecksPath)) {
    fail('supabase/checks/post_migration_checks.sql is missing.');
  }
  if (!fs.existsSync(schemaPath)) {
    fail('supabase/schema.sql is missing.');
  }

  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  if (files.length === 0) {
    fail('No SQL migrations found under supabase/migrations.');
    return;
  }

  let ok = true;
  for (const file of files) {
    if (!/^\d{8}_[a-z0-9_]+\.sql$/.test(file)) {
      fail(`Migration filename does not match expected pattern YYYYMMDD_slug.sql: ${file}`);
      ok = false;
    }
  }

  const postChecks = fs.existsSync(postChecksPath)
    ? fs.readFileSync(postChecksPath, 'utf8')
    : '';
  if (postChecks && !postChecks.includes('grant_room_premium')) {
    fail('post_migration_checks.sql no longer validates grant_room_premium.');
    ok = false;
  }
  if (postChecks && !postChecks.includes('maybe_refill_daily_free_swipes')) {
    fail('post_migration_checks.sql no longer validates maybe_refill_daily_free_swipes.');
    ok = false;
  }

  if (ok) {
    pass(`Validated ${files.length} migration files and migration sanity SQL presence.`);
  }
}

function runKnownBadPatternChecks() {
  logStep('grep audits');
  const checks = [
    {
      label: 'unsupported tabBarButtonTestID prop',
      args: ['-n', 'tabBarButtonTestID', 'src'],
    },
    {
      label: 'non-null assertion on similar_names enrichment',
      args: ['-n', 'similar_names!', 'src'],
    },
    {
      label: 'direct purchased_packs mutation via updateProfile',
      args: ['-n', "updateProfile\\([^\\n]*purchased_packs", 'src'],
    },
    {
      label: 'direct room premium_packs assignment in app code',
      args: ['-n', 'premium_packs\\s*=', 'src'],
    },
  ];

  let clean = true;
  for (const check of checks) {
    const result = spawnSync('rg', check.args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status === 0) {
      clean = false;
      const snippet = (result.stdout || '').trim();
      fail(`${check.label} detected.\n${snippet}`);
      continue;
    }

    if (result.status > 1) {
      clean = false;
      fail(`rg failed while checking "${check.label}" with exit code ${result.status}.`);
    }
  }

  if (clean) {
    pass('Known bad-pattern greps are clean.');
  }
}

function main() {
  runCommand('typecheck', 'npm', ['run', 'typecheck']);
  runKnownBadPatternChecks();
  runI18nAudit();
  runMigrationChecks();

  if (failures.length > 0) {
    console.error('\nPreflight failed:');
    for (const message of failures) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log('\nPreflight passed.');
}

main();
