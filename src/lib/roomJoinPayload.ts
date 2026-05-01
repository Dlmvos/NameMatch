const ROOM_JOIN_PAYLOAD_TYPES = new Set(['namematch_join', 'namenest_join']);
const CURRENT_ROOM_JOIN_PAYLOAD_TYPE = 'namenest_join';

export function createRoomJoinPayload(roomCode: string): string {
  return JSON.stringify({ type: CURRENT_ROOM_JOIN_PAYLOAD_TYPE, roomCode });
}

export function parseRoomJoinPayload(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as { type?: unknown; roomCode?: unknown };
    if (
      typeof parsed.type === 'string' &&
      ROOM_JOIN_PAYLOAD_TYPES.has(parsed.type) &&
      typeof parsed.roomCode === 'string'
    ) {
      return parsed.roomCode.trim().toUpperCase();
    }
  } catch {
    // Not a JSON join payload.
  }
  return null;
}
