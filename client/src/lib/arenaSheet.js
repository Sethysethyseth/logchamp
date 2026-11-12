/**
 * Arena view: how much of the screen the stage gets, and how it rides the
 * page scroll. Pure - no DOM, no React, no imports.
 *
 * - tour: the arena has the screen; the sheet keeps one line and the nav.
 * - open: arrival size on the browsing routes.
 * - strip: the scoreboard strip, on every working route, and on Home while
 *   a workout is in progress.
 */

export const ARENA_STRIP_SVH = 18;

/* The room's share at the open size: what the prototype's sheet leaves
   (arena-draft-2.html, PLACES[..].sheet). */
const OPEN_SVH = {
  "/": 58,
  "/analytics": 62,
  "/sessions": 56,
  "/templates": 54,
  "/profile": 58,
};

/** @returns {{ mode: "tour" | "open" | "strip", svh: number }} */
export function arenaSize({ pathname, tour, live }) {
  if (tour) return { mode: "tour", svh: 100 };
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  const svh = live && path === "/" ? 0 : OPEN_SVH[path];
  return svh ? { mode: "open", svh } : { mode: "strip", svh: ARENA_STRIP_SVH };
}

/**
 * A name for the LED board: uppercase, only A-Z 0-9 : and spaces, cut at a
 * word to fit `max` characters. A first word longer than `max` is cut at `max`.
 */
export function ledFit(value, max) {
  const clean = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9: ]/g, " ")
    .replace(/ +/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const words = clean.split(" ");
  if (words[0].length > max) return words[0].slice(0, max);
  let out = words[0];
  for (const word of words.slice(1)) {
    if (out.length + 1 + word.length > max) break;
    out += ` ${word}`;
  }
  return out;
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

/* A closer look: how far the full view zooms in, and where it may centre. World units. */
export const ARENA_ZOOM = 3;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Keeps a closer look inside the room. */
export function clampFocus({ x, y }) {
  return { x: clamp(x, 20, 480), y: clamp(y, 48, 152) };
}

/** The world coordinate at the view's top-left: the camera's frame at 1x, centred on `focus` at ARENA_ZOOM. */
export function zoomView({ camX, camY, viewW, viewH, focus, zoom }) {
  const t = (zoom - 1) / (ARENA_ZOOM - 1);
  const mx = camX + viewW / 2;
  const my = camY + viewH / 2;
  return {
    x: mx + (focus.x - mx) * t - viewW / 2 / zoom,
    y: my + (focus.y - my) * t - viewH / 2 / zoom,
  };
}
