// Demo mode. Switched on by GAME_MODE=demo in the environment; with any
// other value (or none) nothing here takes effect and the game runs whole.
// Each account gets DEMO_LIMIT of every action below, then a modal explains
// the game is a project demonstration.
export const DEMO_ACTIONS = ["forge", "hunt", "train", "fight"] as const;
export type DemoAction = (typeof DEMO_ACTIONS)[number];
export const DEMO_LIMIT = 10;
// The API answers a blocked action with this message and data.demoLimit set
// to the action; the client opens the demo modal instead of a toast.
export const DEMO_LIMIT_MESSAGE = "Demo limit reached.";
export function isDemoAction(value: unknown): value is DemoAction {
  return typeof value === "string" && (DEMO_ACTIONS as readonly string[]).includes(value);
}
