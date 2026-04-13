import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const raw = fs.readFileSync('./scripts/names.generated.json', 'utf8');
const names = JSON.parse(raw);

const rows = names.map((item) => ({
  name: item.name,
  gender: item.gender,
  origin: item.origin,
  meaning: item.meaning,
  style_tags: item.style_tags ?? [],
  popularity_score: item.popularity_score ?? null,
}));

const { data, error } = await supabase
  .from('names')
  .insert(rows)
  .select('id,name');

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Inserted ${data.length} names`);
console.table(data.slice(0, 10));
