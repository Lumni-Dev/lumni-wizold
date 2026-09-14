// Every periodic request the client makes to the server, in one place.
// Each one is a function invocation on Vercel; a single open tab used to send
// about twenty thousand a day between these alone, which is what exhausted
// the Hobby plan's CPU allowance. To go back to the old cadence, restore the
// previous values here (the old ones are noted beside each).

// Single-tab claim (POST /api/session/tab). Local tabs already coordinate
// through BroadcastChannel; the server claim only covers another device.
export const TAB_HEARTBEAT_MS = 60_000; // was 8_000
export const TAB_STALE_MS = 90_000; // was 25_000

// Presence (PATCH /api/presence) and pack presence polls (GET /api/pack/presence).
export const PRESENCE_HEARTBEAT_MS = 60_000; // was 20_000
export const PRESENCE_STALE_MS = 150_000; // was 45_000
export const PRESENCE_POLL_MS = 120_000; // was 30_000

// Tavern room membership heartbeat (POST /api/tavern/rooms/:id/heartbeat).
// Members only drop after MEMBER_TIMEOUT_MS of silence, measured in hours.
export const TAVERN_ROOM_HEARTBEAT_MS = 60_000; // was 12_000

// Tavern board: the SSE stream re-reads the board this often per open
// connection, and the client polls POST /api/tavern only while the stream is down.
export const TAVERN_STREAM_POLL_MS = 15_000; // was 5_000
export const TAVERN_FALLBACK_POLL_MS = 30_000; // unchanged, but no longer runs beside the stream

// Pack invites list on the tavern screen (GET /api/pack/invites).
export const TAVERN_INVITES_POLL_MS = 60_000; // was 10_000

// Sleep after this long without a gesture (views/components/idle-gate.tsx):
// the game tree unmounts, every heartbeat stops, one modal offers to continue.
export const IDLE_SLEEP_MS = 30 * 60_000;

// Bazaar settlement check (POST /api/state, a full load and save of the game).
export const BAZAAR_SETTLE_MS = 300_000; // was 60_000
