// ============================================================
// NameMatch – AIRankingService
//
// AI as a re-ranking layer, NOT a raw data generator.
//
// Current implementation: heuristic fallback only.
// When a Supabase Edge Function is available that calls Anthropic,
// swap _heuristicRerank() for _edgeFunctionRerank().
//
// The service receives a pre-fetched, normalized list of candidate
// NormalizedNameRecords and optionally re-orders them based on:
//   - A natural-language preference description from the user
//   - The couple's LearningProfile signals
//   - Contextual hints (e.g. "we love nature names")
//
// This keeps AI costs minimal: only called for final re-ranking,
// not for data retrieval.
// ============================================================

import type { NormalizedNameRecord } from './nameTypes';
import type { LearningProfile } from './UserPreferenceLearningService';

export interface AIRankingRequest {
  candidates: NormalizedNameRecord[];
  userProfile?: LearningProfile;
  partnerProfile?: LearningProfile;
  /** Natural-language hint, e.g. "we love nature-inspired vintage names" */
  hint?: string;
  limit?: number;
}

export interface AIRankingResult {
  ranked: NormalizedNameRecord[];
  /** true if AI edge function was used; false if heuristic fallback */
  aiAssisted: boolean;
  /** Optional per-name explanations (populated by AI, empty in fallback) */
  explanations: Record<string, string>;
}

export class AIRankingService {
  private readonly _edgeFunctionUrl: string | null;

  constructor() {
    // Set EXPO_PUBLIC_AI_RANK_URL in env to enable the edge function
    this._edgeFunctionUrl =
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AI_RANK_URL) || null;
  }

  // ──────────────────────────────────────────────────────────
  // rank
  // ──────────────────────────────────────────────────────────

  async rank(request: AIRankingRequest): Promise<AIRankingResult> {
    // Skip AI if no candidates or pool is tiny
    if (request.candidates.length < 5) {
      return {
        ranked: request.candidates.slice(0, request.limit),
        aiAssisted: false,
        explanations: {},
      };
    }

    // Try edge function first
    if (this._edgeFunctionUrl) {
      try {
        return await this._edgeFunctionRerank(request);
      } catch (err) {
        console.warn('[AIRankingService] edge function failed, using heuristic:', err);
      }
    }

    // Heuristic fallback
    return this._heuristicRerank(request);
  }

  // ──────────────────────────────────────────────────────────
  // Heuristic rerank (always available, no API needed)
  // ──────────────────────────────────────────────────────────

  private _heuristicRerank(request: AIRankingRequest): AIRankingResult {
    const { candidates, userProfile, partnerProfile, limit = 50 } = request;

    const scored = candidates.map((name) => ({
      name,
      score: this._heuristicScore(name, userProfile, partnerProfile),
    }));

    scored.sort((a, b) => b.score - a.score);

    return {
      ranked: scored.slice(0, limit).map((s) => s.name),
      aiAssisted: false,
      explanations: {},
    };
  }

  private _heuristicScore(
    name: NormalizedNameRecord,
    userProfile?: LearningProfile,
    partnerProfile?: LearningProfile,
  ): number {
    let score = 0;

    const profiles = [userProfile, partnerProfile].filter(Boolean) as LearningProfile[];

    for (const profile of profiles) {
      // Origin affinity
      const origin = (name.origin ?? '').toLowerCase();
      if (origin && profile.originAffinity[origin] !== undefined) {
        score += profile.originAffinity[origin] * 2;
      }

      // Style affinity
      for (const tag of name.style_tags ?? []) {
        if (profile.styleAffinity[tag] !== undefined) {
          score += profile.styleAffinity[tag];
        }
      }

      // Trend affinity
      const trend = name.trendDirection;
      if (trend && trend !== 'unknown') {
        const k = trend as keyof typeof profile.trendAffinity;
        score += (profile.trendAffinity[k] ?? 0.5) * 1.5;
      }

      // Length affinity
      const displayLen = (name.displayName || name.name).length;
      const lenKey: 'short' | 'medium' | 'long' =
        displayLen <= 4 ? 'short' : displayLen <= 7 ? 'medium' : 'long';
      score += profile.lengthAffinity[lenKey] * 1.0;

      // Letter affinity
      const fl = (name.displayName || name.name)[0]?.toUpperCase();
      if (fl && profile.letterAffinity[fl] !== undefined) {
        score += profile.letterAffinity[fl] * 0.5;
      }

      // Popularity bias
      const rank = name.popularityRank ?? 500;
      const isMainstream = rank <= 100 ? 1 : 0;
      const popularityMatch = Math.abs(isMainstream - profile.popularityBias) < 0.3 ? 1 : 0;
      score += popularityMatch * 0.5;
    }

    // Normalise by number of profiles to keep scale consistent
    if (profiles.length > 0) score /= profiles.length;

    // Small popularity score bonus (already normalised 0-1 in DB)
    score += (name.popularityScore ?? 0) * 0.3;

    return score;
  }

  // ──────────────────────────────────────────────────────────
  // Edge Function rerank (requires EXPO_PUBLIC_AI_RANK_URL)
  // ──────────────────────────────────────────────────────────

  private async _edgeFunctionRerank(request: AIRankingRequest): Promise<AIRankingResult> {
    // TODO: Replace with supabase.functions.invoke() when Edge Function is deployed
    //
    // Example Edge Function (deploy as 'rank-names'):
    //   import Anthropic from '@anthropic-ai/sdk';
    //   const client = new Anthropic();
    //   export default async function handler(req) {
    //     const { candidates, hint, userProfile, partnerProfile } = await req.json();
    //     const prompt = buildRankingPrompt(candidates, hint, userProfile, partnerProfile);
    //     const resp = await client.messages.create({
    //       model: 'claude-haiku-4-5-20251001',
    //       max_tokens: 1024,
    //       messages: [{ role: 'user', content: prompt }],
    //     });
    //     // Parse ranked IDs + explanations from response
    //     return new Response(JSON.stringify(parseRankingResponse(resp)));
    //   }
    //
    // Client call:
    //   const { data } = await supabase.functions.invoke('rank-names', {
    //     body: {
    //       candidates: candidates.map(c => ({ id: c.id, name: c.displayName, origin: c.origin, tags: c.style_tags })),
    //       hint: request.hint,
    //       userProfile: request.userProfile,
    //       partnerProfile: request.partnerProfile,
    //     },
    //   });
    //   return { ranked: reorderByIds(candidates, data.rankedIds), aiAssisted: true, explanations: data.explanations };

    throw new Error('Edge function not yet implemented');
  }
}

/** Singleton */
export const aiRankingService = new AIRankingService();
