/**
 * Arena view: how much of the screen the stage gets, and how it rides the
 * page scroll. Pure - no DOM, no React, no imports.
 *
 * - tour: the arena has the screen; the sheet keeps one line and the nav.
 * - open: arrival size on the browsing routes.
 * - strip: the scoreboard strip, on every working route.
 */

export const ARENA_STRIP_SVH = 18;

const OPEN_SVH = {
  "/": 42,
  "/analytics": 38,
  "/sessions": 34,
  "/templates": 30,
  "/profile": 28,
};

/** @returns {{ mode: "tour" | "open" | "strip", svh: number }} */
export function arenaSize({ pathname, tour }) {
  if (tour) return { mode: "tour", svh: 100 };
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  const svh = OPEN_SVH[path];
  return svh ? { mode: "open", svh } : { mode: "strip", svh: ARENA_STRIP_SVH };
}

/** Px the stage has moved up with the sheet: 1:1 with the scroll, holding at strip height. */
export function stageRide({ scrollY, openPx, stripPx }) {
  const room = openPx - stripPx;
  if (!(room > 0)) return 0;
  return Math.max(0, Math.min(scrollY, room));
}

/** The strip's opacity: 0 until 70% of the ride, linear to 1 at the end. A strip route is always 1. */
export function stripReveal({ ride, openPx, stripPx }) {
  const room = openPx - stripPx;
  if (!(room > 0)) return 1;
  const f = ride / room;
  if (!(f > 0.7)) return 0;
  return Math.min(1, (f - 0.7) / 0.3);
}
