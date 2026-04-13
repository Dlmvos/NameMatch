// ============================================================
// NameMatch – ExternalNameProvider (Scaffold)
//
// TODO: Implement real public data sources.
//
// Candidate APIs / open datasets:
//   - US SSA baby names: https://www.ssa.gov/oact/babynames/limits.html
//     Format: CSV by year, freely downloadable
//     No auth required. Update annually.
//
//   - BehindTheName: https://www.behindthename.com/api/
//     GET /api/lookup.json?name=aria&key=API_KEY
//     Returns etymology, gender, usage. Free tier: 100 req/day.
//     Set BEHIND_THE_NAME_API_KEY in env.
//
//   - Supabase Edge Function (recommended architecture):
//     Deploy a function that fetches from external APIs,
//     caches results in a `external_names` table, and exposes
//     a clean JSON endpoint. The client calls the Edge Function,
//     not the external API directly (avoids CORS, key exposure).
//
// This scaffold always returns [] until a real provider is wired.
// ============================================================

import type { NormalizedNameRecord } from '../nameTypes';
import type { INameProvider, NameQuery } from './INameProvider';

export class ExternalNameProvider implements INameProvider {
  readonly providerId = 'external';
  readonly priority = 5; // highest priority when available (freshest data)

  async isAvailable(): Promise<boolean> {
    // TODO: Check if external provider env var / credentials are set
    // return !!process.env.EXPO_PUBLIC_NAMES_API_ENDPOINT;
    return false;
  }

  async fetchNames(_query?: NameQuery): Promise<NormalizedNameRecord[]> {
    // TODO: implement one of the strategies below:
    //
    // Strategy A – Supabase Edge Function (recommended):
    //   const { data } = await supabase.functions.invoke('fetch-names', {
    //     body: { query: _query },
    //   });
    //   return (data?.names ?? []).map(adaptExternalRow);
    //
    // Strategy B – Direct SSA CSV (offline pre-processing):
    //   Download yob{year}.txt, normalize locally, push to Supabase.
    //   Then this provider is just SupabaseNameProvider with a filter.
    //
    // Strategy C – BehindTheName REST API:
    //   GET https://www.behindthename.com/api/search.json?
    //       usage={region}&key={API_KEY}&page={page}
    //   Adapt with adaptExternalRow().

    return [];
  }

  async fetchById(_id: string): Promise<NormalizedNameRecord | null> {
    // TODO: see strategy notes in fetchNames
    return null;
  }
}

export const externalNameProvider = new ExternalNameProvider();
