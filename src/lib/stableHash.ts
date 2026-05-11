/**
 * FNV-1a 32-bit — same algorithm as partner shared deck ordering (roomId:nameId).
 * Used for deterministic, cross-client seeds (e.g. room-scoped shuffles).
 */
export function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
