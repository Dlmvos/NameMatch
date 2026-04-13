// ============================================================
// NameMatch – AI Name Generator Scaffold
// Currently returns curated mock suggestions based on input.
// In production: replace generateNameSuggestions() body with
// a call to a Supabase Edge Function that calls the Anthropic
// API (claude-haiku-4-5) with a structured prompt.
// ============================================================

import { AINameRequest, SuggestedName, GenderPreference } from '../types';

// Mock suggestion banks by style
const SUGGESTIONS: Record<string, SuggestedName[]> = {
  nature: [
    { name: 'River',   meaning: 'A flowing body of water',          origin: 'English',  reason: 'Nature-inspired, gender-neutral, timeless' },
    { name: 'Sage',    meaning: 'Wise; a healing herb',             origin: 'Latin',    reason: 'Botanical, calm, rising quickly in popularity' },
    { name: 'Hazel',   meaning: 'The hazel tree; commander',        origin: 'English',  reason: 'Warmth of nature with classic charm' },
    { name: 'Birch',   meaning: 'A type of tree; bright',           origin: 'Norse',    reason: 'Strong, Scandinavian nature feel' },
    { name: 'Wren',    meaning: 'Small songbird',                    origin: 'English',  reason: 'Short, sweet, increasingly popular' },
  ],
  classic: [
    { name: 'Eleanor', meaning: 'Bright, shining one',              origin: 'Greek',    reason: 'Timeless elegance with royal roots' },
    { name: 'Arthur',  meaning: 'Noble, courageous bear',           origin: 'Celtic',   reason: 'Classic revival, literary and regal' },
    { name: 'Clara',   meaning: 'Bright, clear, famous',            origin: 'Latin',    reason: 'Clean, classic, internationally beloved' },
    { name: 'Edmund',  meaning: 'Wealthy protector',                 origin: 'English',  reason: 'Distinguished, literary, underused gem' },
    { name: 'Beatrice',meaning: 'She who brings happiness',         origin: 'Italian',  reason: 'Dante, Shakespeare, and now trending again' },
  ],
  modern: [
    { name: 'Zion',    meaning: 'Highest point; monument',          origin: 'Hebrew',   reason: 'Bold, meaningful, cross-cultural appeal' },
    { name: 'Nova',    meaning: 'New; a star that brightens',       origin: 'Latin',    reason: 'Cosmic, modern, skyrocketing in use' },
    { name: 'Axel',    meaning: 'Father of peace',                  origin: 'Scandinavian', reason: 'Cool sound, strong meaning, globally used' },
    { name: 'Lyra',    meaning: 'Lyre; a star constellation',       origin: 'Greek',    reason: 'Musical, celestial, fresh but not invented' },
    { name: 'Milo',    meaning: 'Merciful; soldier',                origin: 'Germanic', reason: 'Friendly, energetic, top 50 and rising' },
  ],
  unique: [
    { name: 'Caius',   meaning: 'Rejoice',                          origin: 'Latin',    reason: 'Ancient Roman rarity, distinctive sound' },
    { name: 'Seren',   meaning: 'Star; calm',                       origin: 'Welsh',    reason: 'Beautiful Welsh name, almost unknown outside Wales' },
    { name: 'Idris',   meaning: 'Studious lord',                    origin: 'Welsh/Arabic', reason: 'Mythic, musical, rare outside of Wales' },
    { name: 'Aveline', meaning: 'Hazelnut; wished-for child',      origin: 'French',   reason: 'Medieval French rarity with musical sound' },
    { name: 'Cosmo',   meaning: 'Order; beauty of the universe',   origin: 'Greek',    reason: 'Celestial, artistic, only ~200 born/year in US' },
  ],
  royal: [
    { name: 'Adelaide', meaning: 'Noble kind; nobility',            origin: 'Germanic', reason: 'Royal history, rising fast in English-speaking world' },
    { name: 'Leopold',  meaning: 'Bold people',                     origin: 'Germanic', reason: 'Aristocratic, strong, due for a comeback' },
    { name: 'Matilda',  meaning: 'Mighty in battle',                origin: 'Germanic', reason: 'Medieval queen name, warm nickname Tilly' },
    { name: 'Casimir',  meaning: 'Proclaimer of peace',             origin: 'Slavic',   reason: 'Polish royal heritage, rare but regal' },
    { name: 'Philippa', meaning: 'Lover of horses',                 origin: 'Greek',    reason: 'Medieval English queen, vintage and fresh' },
  ],
};

/**
 * Generate name suggestions based on the user's request.
 *
 * TODO (production): Replace this function body with:
 *   const { data } = await supabase.functions.invoke('generate-names', { body: request });
 *   return data.suggestions as SuggestedName[];
 */
export async function generateNameSuggestions(
  request: AINameRequest
): Promise<SuggestedName[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800));

  const style = request.style?.toLowerCase() ?? 'modern';
  const bank = SUGGESTIONS[style] ?? SUGGESTIONS.modern;

  // Filter by gender preference if applicable
  // (mock data is mostly neutral — in production the LLM handles this)
  let results = [...bank];

  // Apply length preference filter
  if (request.lengthPreference === 'short') {
    results = results.filter((n) => n.name.length <= 4);
  } else if (request.lengthPreference === 'long') {
    results = results.filter((n) => n.name.length >= 7);
  }

  // Shuffle slightly
  return results.sort(() => Math.random() - 0.5).slice(0, 4);
}

export const AI_STYLES = [
  { key: 'nature',  label: 'Nature',  emoji: '🌿' },
  { key: 'classic', label: 'Classic', emoji: '📚' },
  { key: 'modern',  label: 'Modern',  emoji: '✨' },
  { key: 'unique',  label: 'Unique',  emoji: '🦋' },
  { key: 'royal',   label: 'Royal',   emoji: '👑' },
];
