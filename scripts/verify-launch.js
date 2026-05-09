#!/usr/bin/env node
/**
 * Launch verification for Babinom (Expo RN). Run from repo root: npm run verify:launch
 * Does not run typecheck — keep separate (`npm run typecheck`).
 *
 * i18n: locales are Partial maps; `t()` falls back to EN. We assert that wiring plus no
 * locale-only keys outside EN (extras). Missing keys log WARN but do not fail the script.
 */

const fs = require('fs');
const path = require('path');

try {
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* optional dependency missing — rely on process.env only */
}

const ROOT = path.join(__dirname, '..');

const REQUIRED_ENV = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

const REQUIRED_MIGRATIONS = [
  '20260510_room_premium_packs_lockdown.sql',
  '20260511_supabase_audit_fixes.sql',
];

const I18N_LOCALES = ['nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  'Pods',
  'build',
  'dist',
  'coverage',
]);

const SKIP_VERIFY_LAUNCH_SELF = path.join('scripts', 'verify-launch.js');

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`OK    ${msg}`);
}

/** Minimal sanity: standalone typo tokens (won't match correct check_and_create_match). */
const TYPO_RPC_TRUNCATED = /\bcheck_and_create_matc\b/;
const TYPO_RPC_EXTRA_H = /\bcheck_and_create_matchh\b/;

/** Brace-balanced substring starting at `{`; returns content inside braces or null. */
function sliceBraceBalanced(src, openBraceIdx) {
  let i = openBraceIdx;
  let depth = 0;
  let inSQ = false;
  let inDQ = false;
  let inTM = false;
  let tmNest = 0;
  let esc = false;

  for (; i < src.length; i++) {
    const ch = src[i];

    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\' && (inSQ || inDQ || inTM)) {
      esc = true;
      continue;
    }

    if (!inDQ && !inTM && inSQ) {
      if (ch === '\'') inSQ = false;
      continue;
    }
    if (!inSQ && !inTM && inDQ) {
      if (ch === '"') inDQ = false;
      continue;
    }
    if (!inSQ && !inDQ && inTM) {
      if (ch === '`') {
        inTM = false;
        tmNest = 0;
      } else if (ch === '{' && src.slice(i - 1, i + 1) !== '${') {
        tmNest++;
      } else if (ch === '}' && tmNest > 0) tmNest--;
      continue;
    }

    if (ch === '\'' && !inDQ && !inTM) {
      inSQ = true;
      continue;
    }
    if (ch === '"' && !inSQ && !inTM) {
      inDQ = true;
      continue;
    }
    if (ch === '`' && !inSQ && !inDQ) {
      inTM = true;
      tmNest = 0;
      continue;
    }

    if (!inSQ && !inDQ && !inTM) {
      if (ch === '/' && src[i + 1] === '/') {
        i++;
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      if (ch === '/' && src[i + 1] === '*') {
        i += 2;
        while (i + 1 < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i++;
        continue;
      }

      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(openBraceIdx + 1, i);
        if (depth < 0) return null;
      }
    }
  }
  return null;
}

function extractKeysFromTranslationBody(body) {
  const keys = new Set();
  const re = /^\s*'([\w.-]+)'\s*:/gm;
  let m;
  while ((m = re.exec(body)) !== null) keys.add(m[1]);
  return keys;
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function verifyEnv() {
  let ok = true;
  const placeholders = [
    /^https:\/\/your-project\.supabase\.co$/i,
    /^your-anon-key-here$/i,
    /^missing-supabase/i,
  ];
  for (const key of REQUIRED_ENV) {
    const v = process.env[key]?.trim() ?? '';
    if (!v) {
      fail(`missing env ${key} (set in .env or export before verify)`);
      ok = false;
      continue;
    }
    if (placeholders.some((re) => re.test(v))) {
      fail(`env ${key} looks like a placeholder`);
      ok = false;
    }
  }
  if (ok) pass('required env vars present (non-placeholder)');
}

function verifyNoRpcTypos() {
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sql', '.md']);
  let ok = true;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(abs);
        continue;
      }
      if (rel === SKIP_VERIFY_LAUNCH_SELF) continue;
      const ext = path.extname(e.name);
      if (!exts.has(ext)) continue;
      let content;
      try {
        content = readUtf8(abs);
      } catch {
        continue;
      }
      if (TYPO_RPC_TRUNCATED.test(content)) {
        fail('typo RPC name check_and_create_matc in ' + rel);
        ok = false;
      }
      if (TYPO_RPC_EXTRA_H.test(content)) {
        fail('typo RPC name check_and_create_matchh in ' + rel);
        ok = false;
      }
    }
  }
  walk(ROOT);
  if (ok) pass('no forbidden RPC typo strings');
}

/** Chained `.from('rooms').update({ … premium_packs: … })` under src (RPC paths use `p_premium_packs`). */
function isSuspiciousPremiumPackRoomsUpdate(content) {
  const chained =
    /\.from\s*\(\s*['"]rooms['"]\)[\s\S]{0,2500}?\.update\s*\(\s*\{[\s\S]{0,1200}?\bpremium_packs\s*:/s.test(
      content,
    ) ||
    /\.from\s*\(\s*`rooms`\)[\s\S]{0,2500}?\.update\s*\(\s*\{[\s\S]{0,1200}?\bpremium_packs\s*:/s.test(content);

  return chained;
}

function verifyPremiumPackRoomsUpdates() {
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
  let ok = true;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(abs);
        continue;
      }
      if (!rel.startsWith('src/')) continue;
      if (!exts.has(path.extname(e.name))) continue;
      const content = readUtf8(abs);
      if (isSuspiciousPremiumPackRoomsUpdate(content)) {
        fail(`possible direct rooms.update with premium_packs in client — audit ${rel}`);
        ok = false;
      }
    }
  }
  walk(path.join(ROOT, 'src'));
  if (ok) pass('no unguarded direct rooms.update({ premium_packs }) pattern under src/');
}

function verifyI18nLocales(runtimePath) {
  const raw = readUtf8(runtimePath);
  const enHeader = 'const EN: TranslationMap = ';
  const enIdx = raw.indexOf(enHeader);
  if (enIdx === -1) {
    fail('could not find EN translation map in runtime.ts');
    return;
  }
  const braceOpen = raw.indexOf('{', enIdx + enHeader.length);
  const enBody = sliceBraceBalanced(raw, braceOpen);
  if (enBody == null) {
    fail('could not parse EN brace block');
    return;
  }
  const enKeys = extractKeysFromTranslationBody(enBody);

  if (!raw.includes('TRANSLATIONS[normalized]?.[key] ?? EN[key]')) {
    fail('t() must resolve templates as TRANSLATIONS[..]?.[key] ?? EN[key] (partial locales rely on EN fallback)');
    return;
  }

  const transMarker = 'const TRANSLATIONS: Record<string, Partial<TranslationMap>> = ';
  const transIdx = raw.indexOf(transMarker);
  if (transIdx === -1) {
    fail('could not find TRANSLATIONS map');
    return;
  }
  const transBraceOpen = raw.indexOf('{', transIdx + transMarker.length);
  const transInnerStart = transBraceOpen + 1;

  let ok = true;
  for (const locale of I18N_LOCALES) {
    const needle = new RegExp(`\\n\\s*${locale}\\s*:\\s*\\{`);
    const match = needle.exec(raw.slice(transInnerStart));
    if (!match) {
      fail('locale ' + locale + ' block not found in TRANSLATIONS');
      ok = false;
      continue;
    }
    const localeBraceAbsIdx = transInnerStart + match.index + match[0].length - 1;
    const localeBody = sliceBraceBalanced(raw, localeBraceAbsIdx);
    if (localeBody == null) {
      fail('could not parse brace body for locale ' + locale);
      ok = false;
      continue;
    }
    const locKeys = extractKeysFromTranslationBody(localeBody);
    const missing = [...enKeys].filter((k) => !locKeys.has(k));
    const extra = [...locKeys].filter((k) => !enKeys.has(k));
    if (extra.length) {
      ok = false;
      fail(
        'locale ' + locale + ' has keys not in EN (' + extra.length + ') — likely typos or stale entries',
      );
      extra.slice(0, 16).forEach((k) => console.error('      extra key: ' + k));
      if (extra.length > 16) console.error('      …');
    }
    if (missing.length) {
      console.warn(
        'WARN  locale ' +
          locale +
          ' omits ' +
          missing.length +
          ' EN keys (filled at runtime via EN fallback)',
      );
      if (missing.length <= 8) missing.forEach((k) => console.warn('      missing key: ' + k));
      else console.warn('      first missing keys: ' + missing.slice(0, 8).join(', ') + ' …');
    }
  }

  if (ok) {
    pass(
      'i18n: locales use only EN-defined keys; runtime merges TRANSLATIONS[..]?.[key] ?? EN[key]',
    );
  }
}

function verifyPaywallMainTabsGuard() {
  const payPath = path.join(ROOT, 'src', 'screens', 'PaywallScreen.tsx');
  const raw = readUtf8(payPath);
  if (!raw.includes('stackRegistersMainTabs(nav)') || !raw.includes("routeNames.includes('MainTabs')")) {
    fail('PaywallScreen.tsx missing stackRegistersMainTabs / MainTabs route probe');
    process.exitCode = 1;
    return;
  }
  const gatePresent =
    /if\s*\(\s*stackRegistersMainTabs\s*\(\s*nav\s*\)\s*\)\s*\{[^]*?replace\s*\(\s*['"]MainTabs['"]/s.test(
      raw,
    );
  if (!gatePresent) {
    fail('PaywallScreen.tsx replace(MainTabs) must be gated by stackRegistersMainTabs(nav)');
    process.exitCode = 1;
    return;
  }
  pass('PaywallScreen replace(MainTabs) guarded when route exists');
}

function verifyPrivacyManifest() {
  const p = path.join(ROOT, 'ios', 'NameNest', 'PrivacyInfo.xcprivacy');
  if (!fs.existsSync(p)) {
    fail('PrivacyInfo.xcprivacy missing (expected ios/NameNest/PrivacyInfo.xcprivacy)');
    process.exitCode = 1;
    return;
  }
  pass('PrivacyInfo.xcprivacy exists');
}

function verifyMigrations() {
  const dir = path.join(ROOT, 'supabase', 'migrations');
  let ok = true;
  for (const name of REQUIRED_MIGRATIONS) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) {
      fail(`missing migration ${name}`);
      ok = false;
    }
  }
  if (ok) pass(`required migrations present (${REQUIRED_MIGRATIONS.join(', ')})`);
}

function main() {
  process.exitCode = 0;

  verifyEnv();
  verifyNoRpcTypos();
  verifyPremiumPackRoomsUpdates();
  verifyPaywallMainTabsGuard();

  const runtimePath = path.join(ROOT, 'src', 'i18n', 'runtime.ts');
  if (!fs.existsSync(runtimePath)) {
    fail('src/i18n/runtime.ts not found');
  } else {
    verifyI18nLocales(runtimePath);
  }

  verifyPrivacyManifest();
  verifyMigrations();

  if (process.exitCode !== 0) {
    console.error('\nverify:launch failed — fix issues above (typecheck is separate).');
    process.exit(1);
  } else {
    console.log('\nverify:launch — all checks passed.');
  }
}

main();
