/**
 * Hook that returns per-country chip counts intersected with the FilterSheet
 * draft filters (starting letter, length buckets, trend, gender).
 *
 * Wraps the Supabase RPC `public.country_counts_with_filters` (defined in
 * migration 20260620). The RPC runs SECURITY INVOKER so the counts reflect
 * the caller's RLS slice — non-premium users count public rows; premium
 * users with an entitled pack also count those rows.
 *
 * What's intentionally NOT in the RPC parameters
 * ─────────────────────────────────────────────
 * - `origins` (the country picker itself). Counts answer "what if I picked
 *   this country?", so applying the origins filter would be circular.
 * - `vibes`. Vibes are regex heuristics over the name string, not DB
 *   columns. We accept the documented limitation that chip counts ignore
 *   vibe selection — the deck pipeline still applies the vibe filter when
 *   it surfaces names, so the user sees the right names; the chip count
 *   above the picker is just a slight overcount when vibes are active.
 *
 * Fallback semantics
 * ──────────────────
 * Returns `chips = null` whenever:
 *  - the RPC isn't installed yet (older PostgREST cache without the fn)
 *  - the network call errors
 *  - we're still mounting / debouncing the first fetch
 * The consumer (FilterSheet) treats `null` as "use the old sync
 * getOriginCountryChips fallback" so chip counts are never empty.
 *
 * Debouncing
 * ──────────
 * 180ms debounce on draft changes. Tap-pingponging filters in the sheet
 * triggers one RPC after the user pauses; reduces request volume by ~70%
 * during burst toggling.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '../lib/supabase';
import { findCountry } from '../data/countries';
import {
  NameFilters,
  NameLength,
  NameTrend,
  OriginCountryChip,
  ORIGIN_FILTER_WORLDWIDE,
} from '../types';

interface RpcRow {
  country: string | null;
  count: number | null;
}

interface IntersectedChipsResult {
  /** Null while we don't yet have RPC counts; consumer should fall back. */
  chips: OriginCountryChip[] | null;
  /** True while a fetch is in flight. */
  loading: boolean;
  /** Last error from the RPC; null if last fetch succeeded. */
  error: Error | null;
}

const DEBOUNCE_MS = 180;

/**
 * Stable string key for a draft's RPC-relevant slice. We intentionally
 * ignore `origins` and `vibes` (see header). The key drives the debounced
 * fetch effect — when this changes, we refetch; otherwise we don't.
 *
 * Gender comes from the user profile (`genderPreference`), not the draft,
 * because the FilterSheet doesn't expose gender. It's still part of the
 * fetch key so a profile-level gender change re-runs the RPC.
 */
function rpcKey(draft: NameFilters, genderPref: string | null): string {
  const lengths = [...(draft.lengths ?? [])].sort().join(',');
  const trends = [...(draft.trends ?? [])].sort().join(',');
  const starting = (draft.startingLetter ?? '').trim().toUpperCase();
  const gender = (genderPref ?? '').trim();
  return `${starting}|${lengths}|${trends}|${gender}`;
}

function buildRpcArgs(
  draft: NameFilters,
  genderPref: string | null,
): {
  p_starting_letter: string | null;
  p_lengths: NameLength[] | null;
  p_trends: NameTrend[] | null;
  p_gender: string | null;
  p_include_worldwide_chip: boolean;
} {
  const startingLetter = (draft.startingLetter ?? '').trim();
  const lengths = draft.lengths ?? [];
  const trends = draft.trends ?? [];
  const gender = (genderPref ?? '').trim();
  return {
    p_starting_letter: startingLetter ? startingLetter : null,
    p_lengths: lengths.length > 0 ? lengths : null,
    p_trends: trends.length > 0 ? trends : null,
    p_gender:
      gender === 'boy' || gender === 'girl' ? gender : null,
    p_include_worldwide_chip: true,
  };
}

export function useIntersectedCountryChipCounts(
  draft: NameFilters,
  options: {
    countryPreference?: string | null;
    genderPreference?: string | null;
  } = {},
): IntersectedChipsResult {
  const [chips, setChips] = useState<OriginCountryChip[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const genderPref = options.genderPreference ?? null;
  const key = useMemo(() => rpcKey(draft, genderPref), [draft, genderPref]);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const seq = ++requestSeqRef.current;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const { data, error: rpcError } = await supabase.rpc(
            'country_counts_with_filters',
            buildRpcArgs(draft, genderPref),
          );
          // If a newer request started after us, drop this result.
          if (cancelled || seq !== requestSeqRef.current) return;
          if (rpcError) {
            // Mark error but DON'T blank `chips` — keep last-good values so
            // the UI doesn't flicker between RPC and fallback on transient
            // failures. Consumer can read `error` if they want to surface it.
            setError(new Error(rpcError.message));
            setLoading(false);
            return;
          }
          const rows = (data ?? []) as RpcRow[];
          const next: OriginCountryChip[] = [];
          for (const row of rows) {
            const country = (row.country ?? '').trim();
            const n =
              typeof row.count === 'number'
                ? row.count
                : Number(row.count ?? 0);
            if (!country || !Number.isFinite(n) || n <= 0) continue;
            if (country === ORIGIN_FILTER_WORLDWIDE) {
              next.push({ country, count: n, flag: '🌍' });
              continue;
            }
            next.push({
              country,
              count: n,
              flag: findCountry(country)?.flag,
            });
          }
          // Stable sort: pinned country first, then by count desc, then alpha.
          const pref = (options.countryPreference ?? '').trim();
          next.sort((a, b) => {
            if (pref) {
              if (a.country === pref && b.country !== pref) return -1;
              if (b.country === pref && a.country !== pref) return 1;
            }
            return b.count - a.count || a.country.localeCompare(b.country);
          });
          setChips(next);
          setError(null);
          setLoading(false);
        } catch (err) {
          if (cancelled || seq !== requestSeqRef.current) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, options.countryPreference]);

  return { chips, loading, error };
}
