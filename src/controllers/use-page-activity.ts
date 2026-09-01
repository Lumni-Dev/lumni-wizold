"use client";

/**
 * Activities keep running in ActivityEngine while the player browses other pages.
 * This hook only blocks foreign jobs from starting on the wrong screen.
 */
export function usePageActivity(_kinds: readonly string[]): void {
  void _kinds;
  // Navigation no longer stops the active job.
}
