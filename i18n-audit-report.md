# i18n Audit Report — Hard-coded English Strings

**App:** Babinom (React Native Expo)
**Scope:** `src/screens/**/*.tsx`, `src/components/**/*.tsx`, `src/navigation/**/*.tsx`
**Date:** 2026-05-08

## Exclusions applied

- `console.*` / dev logging
- Strings inside `__DEV__` guards
- imports / types / styles / colors / theme tokens
- Analytics event names
- Technical identifiers (storage keys, route names, entitlement IDs)
- Emoji-only strings
- Strings already wrapped in `t()` or `tr()`
- Comments

---

## BLOCKERS — visible in launch-critical flows

| # | File | Line | Exact string | UI location |Proposed i18n key |
|---|------|------|-------------|-------------|------------------|
| 1 | MatchesScreen.tsx | 45 | `` `We matched on ${name.name} ❤️ Try Babinom` `` | Share sheet message | `matches.share.message` |
| 2 | MatchesScreen.tsx | 492 | `'Boy'` | Gender label on match card | `gender.boy` |
| 3 | MatchesScreen.tsx | 492 | `'Girl'` | Gender label on match card | `gender.girl` |
| 4 | MatchesScreen.tsx | 492 | `'Neutral'` | Gender label on match card | `gender.neutral` |
| 5 | PreferencesScreen.tsx | 76 | `'Almost there!'` | Alert title (onboarding) | `preferences.alert.almostTitle` |
| 6 | PreferencesScreen.tsx | 76 | `'Please select a preference to continue.'` | Alert body (onboarding) | `preferences.alert.almostBody` |
| 7 | PreferencesScreen.tsx | 84 | `'Saving took too long. Please try again.'` | Timeout error message | `preferences.alert.timeout` |
| 8 | PreferencesScreen.tsx | 90 | `'Error'` | Alert title | `common.error` (already exists — just needs `t()` wrapping) |
| 9 | PreferencesScreen.tsx | 90 | `'Something went wrong.'` | Alert body | `common.genericError` |
| 10 | RegionScreen.tsx | 119 | `'Unlock more names, deeper meanings, and smarter matches'` | Premium preview title | `region.premiumPreview.title` |
| 11 | RegionScreen.tsx | 134 | `'See Premium'` | Premium preview CTA button | `region.premiumPreview.cta` |
| 12 | SwipeCard.tsx | 52 | `'Uncommon'` | Rarity badge on swipe card | `rarity.uncommon` |
| 13 | SwipeCard.tsx | 54 | `'Rare'` | Rarity badge on swipe card | `rarity.rare` |
| 14 | SwipeCard.tsx | 56 | `'Very rare'` | Rarity badge on swipe card | `rarity.veryRare` |
| 15 | SwipeCard.tsx | 64 | `'Top 50'` | Popularity badge on swipe card | `popularity.top50` |
| 16 | SwipeCard.tsx | 65 | `'Top 100'` | Popularity badge on swipe card | `popularity.top100` |
| 17 | NameDetailModal.tsx | 26 | `'Modern'` | Character tag | `character.modern` |
| 18 | NameDetailModal.tsx | 27 | `'Elegant'` | Character tag | `character.elegant` |
| 19 | NameDetailModal.tsx | 30 | `'Trending'` | Character tag | `character.trending` |
| 20 | NameDetailModal.tsx | 31 | `'Timeless'` | Character tag | `character.timeless` |
| 21 | NameDetailModal.tsx | 34 | `'Classical'` | Character tag | `character.classical` |
| 22 | NameDetailModal.tsx | 35 | `'Romantic'` | Character tag | `character.romantic` |
| 23 | NameDetailModal.tsx | 36 | `'Strong'` | Character tag | `character.strong` |
| 24 | NameDetailModal.tsx | 37 | `'Noble'` | Character tag | `character.noble` |
| 25 | NameDetailModal.tsx | 38 | `'Graceful'` | Character tag | `character.graceful` |
| 26 | NameDetailModal.tsx | 39 | `'Spirited'` | Character tag | `character.spirited` |
| 27 | NameDetailModal.tsx | 43 | `'Rare'` | Character tag | `character.rare` |
| 28 | NameDetailModal.tsx | 44 | `'Beloved'` | Character tag | `character.beloved` |
| 29 | NameDetailModal.tsx | 49 | `'Graceful'` | Character tag (girl fallback) | (reuse `character.graceful`) |
| 30 | NameDetailModal.tsx | 60 | `'Very Popular'` | Popularity tier label | `popularity.veryPopular` |
| 31 | NameDetailModal.tsx | 61 | `'Popular'` | Popularity tier label | `popularity.popular` |
| 32 | NameDetailModal.tsx | 62 | `'Well Known'` | Popularity tier label | `popularity.wellKnown` |
| 33 | NameDetailModal.tsx | 63 | `'Uncommon'` | Popularity tier label | `popularity.uncommon` |
| 34 | NameDetailModal.tsx | 64 | `'Rare'` | Popularity tier label | `popularity.rare` |
| 35 | NameDetailModal.tsx | 185 | `'MEANING'` | Section heading in name detail | `nameDetail.section.meaning` |
| 36 | NameDetailModal.tsx | 193 | `'POPULARITY'` | Section heading in name detail | `nameDetail.section.popularity` |
| 37 | NameDetailModal.tsx | 206 | `` `Rank #${detail.rank}` `` | Rank display in name detail | `nameDetail.rank` |
| 38 | NameDetailModal.tsx | 214 | `'CHARACTER'` | Section heading in name detail | `nameDetail.section.character` |
| 39 | NameDetailModal.tsx | 228 | `'YOU MIGHT ALSO LIKE'` | Section heading in name detail | `nameDetail.section.similar` |
| 40 | FilterSheet.tsx | 42 | `'Modern'` | Quick chip label | `filter.chip.modern` |
| 41 | FilterSheet.tsx | 43 | `'Classic'` | Quick chip label | `filter.chip.classic` |
| 42 | FilterSheet.tsx | 44 | `'Short'` | Quick chip label | `filter.chip.short` |
| 43 | FilterSheet.tsx | 45 | `'Unique'` | Quick chip label | `filter.chip.unique` |
| 44 | FilterSheet.tsx | 46 | `'International'` | Quick chip label | `filter.chip.international` |
| 45 | FilterSheet.tsx | 47 | `'Spanish'` | Quick chip label | `filter.chip.spanish` |
| 46 | FilterSheet.tsx | 48 | `'Dutch'` | Quick chip label | `filter.chip.dutch` |
| 47 | FilterSheet.tsx | 49 | `'Soft'` | Quick chip label | `filter.chip.soft` |
| 48 | FilterSheet.tsx | 50 | `'Strong'` | Quick chip label | `filter.chip.strong` |
| 49 | FilterSheet.tsx | 229 | `'STYLE / CULTURE'` | Section label in filter sheet | `filter.section.style` |
| 50 | FilterSheet.tsx | 230 | `'Combine chips to shape the deck without typing.'` | Section hint in filter sheet | `filter.section.styleHint` |
| 51 | FilterSheet.tsx | 389 | `'Less'` | Toggle button text | `filter.letters.less` |
| 52 | FilterSheet.tsx | 389 | `'More'` | Toggle button text | `filter.letters.more` |

---

## WARNINGS — visible but low exposure or edge-case

| # | File | Line | Exact string | UI location | Proposed i18n key | Notes |
|---|------|------|-------------|-------------|-------------------|-------|
| 53 | ErrorBoundary.tsx | 37 | `'Something went wrong'` | Error boundary title | `error.title` | Class component — renders outside I18nProvider. Cannot use `useTranslation()` hook. Needs static `t()` import from runtime.ts or accept English-only for this rare crash state. |
| 54 | ErrorBoundary.tsx | 38-39 | `'Babinom hit a small hiccup. Try again to return to your names.'` | Error boundary body | `error.body` | Same constraint as above. |
| 55 | ErrorBoundary.tsx | 42 | `'Try again'` | Error boundary button | `error.retry` | Same constraint as above. |
| 56 | AppNavigator.tsx | 48 | `'Try again'` | Startup error retry button | `error.retry` | Renders before I18nProvider is mounted. Same constraint — no hook access. |
| 57 | SettingsScreen.tsx | 376 | `'1.0.0'` | Version number display | n/a | Not an i18n issue. Should use `Constants.expoConfig?.version` so it stays current with app.json automatically. |

---

## Clean files (no findings)

These files were audited and all user-visible strings already use `t()`:

- ShopScreen.tsx (only `__DEV__` strings)
- PaywallScreen.tsx
- SwipeScreen.tsx (only `__DEV__` strings)
- WelcomeScreen.tsx
- AuthScreen.tsx (fixed in prior session)
- CountryScreen.tsx (fixed in prior session)

---

## Implementation notes

### NameDetailModal.tsx — `deriveCharacterTags()` and `popularityTier()`

These are pure functions that return English label strings. To i18n them, change them to return **keys** instead of display strings, then apply `t()` at render time:

```typescript
// Before
if (len <= 4) tags.push('Modern');

// After
if (len <= 4) tags.push('modern');
// ... at render time:
<Text>{t(`character.${tag}`)}</Text>
```

Same pattern for `popularityTier()` — return a key like `'veryPopular'` and render `t(`popularity.${tier.key}`)`.

### FilterSheet.tsx — `QUICK_CHIPS` array

Labels are defined at module level. Change to derive label at render time:

```typescript
// Before
const QUICK_CHIPS = [
  { key: 'modern', label: 'Modern', trend: 'rising' },
  ...
];

// After — remove label from constant, derive in JSX:
<Text>{t(`filter.chip.${chip.key}`)}</Text>
```

### ErrorBoundary.tsx + AppNavigator.tsx

These render outside `<I18nProvider>`. Options:
1. Import the static `t()` function directly from `src/i18n/runtime.ts` (it works without React context)
2. Accept English-only for these rare error/startup states

### Supported languages

All new keys need translations in: `en`, `nl`, `de`, `fr`, `es`, `it`, `pt`, `zh`, `ja`, `ko`, `ar`

### i18n file

All keys go in: `src/i18n/runtime.ts`
