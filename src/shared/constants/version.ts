// The running build's game version. Bump it on every release that must reach
// players at once: an already-open tab keeps running its old bundle, so it polls
// the server's current version and, when this constant no longer matches, prompts
// a cache-clearing reload. Client and server import the SAME constant, so within
// one build they always agree; across a deploy the old bundle differs from the
// new server, which is exactly the staleness signal. Bump on a real release, not
// on every commit.
export const GAME_VERSION = "1.3.0";

// How often an open tab asks the server for its current version. One minute is
// frequent enough to reach players soon after a deploy without polling noise.
export const VERSION_POLL_MS = 60000;
