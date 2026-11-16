/**
 * Swiping sideways between the five tabs (Seth, Nov 16). Pure helpers plus
 * the two small channels the gesture needs: an event the Arena listens to
 * (so the room's camera travels with the finger), and a one-shot flag that
 * tells RouteTransition the page already arrived under the finger and needs
 * no entrance of its own. No React.
 */
import { NAV_SECTIONS } from "../components/motion/navOrder.js";

export const TAB_SWIPE_EVENT = "workoutdb-tab-swipe";

/** Share of the screen's width a drag must cover to change tab without a flick. */
export const TAB_SWIPE_COMMIT = 0.35;
/** Px per ms: a flick this fast changes tab from any distance. */
export const TAB_SWIPE_FLICK = 0.4;

const trim = (pathname) => String(pathname || "/").replace(/\/+$/, "") || "/";

/** The tab a path IS (only a tab's own first page can be swiped), or -1. */
export function tabIndexOf(pathname) {
  const p = trim(pathname);
  return NAV_SECTIONS.findIndex((s) => s.to === p);
}

/** The tab `step` places along the nav from this path (+1 = to the right), or null. */
export function tabNeighbour(pathname, step) {
  const i = tabIndexOf(pathname);
  if (i === -1) return null;
  return NAV_SECTIONS[i + step] || null;
}

/**
 * Where a released drag goes. `q` is the page's offset as a share of the
 * width (negative = dragged left, toward the next tab); `v` is the finger's
 * speed in px/ms (negative = leftward). Returns -1 (next tab), 1 (previous
 * tab) or 0 (stay).
 */
export function decideTabSwipe({ q, v, next, prev }) {
  const can = (side) => (side < 0 ? Boolean(next) : Boolean(prev));
  if (Math.abs(v) > TAB_SWIPE_FLICK) {
    const side = v < 0 ? -1 : 1;
    // A flick back against the drag just lets go.
    if (q !== 0 && Math.sign(q) !== side) return 0;
    return can(side) ? side : 0;
  }
  if (Math.abs(q) < TAB_SWIPE_COMMIT) return 0;
  const side = q < 0 ? -1 : 1;
  return can(side) ? side : 0;
}

/** Tell the Arena where the finger is: `to` = the path being dragged toward, `t` = 0..1. `null` ends it. */
export function publishTabSwipe(to, t = 0) {
  window.dispatchEvent(new CustomEvent(TAB_SWIPE_EVENT, { detail: { to, t } }));
}

let arrived = null;

/**
 * The next navigation comes from a swipe. `carried` = the page rode in under
 * the finger and needs no entrance; false (reduced motion) = the usual
 * crossfade.
 */
export function markTabSwipeNav(carried = true) {
  arrived = carried ? "carried" : "fade";
}

/** "carried" | "fade" | null, once. */
export function takeTabSwipeNav() {
  const was = arrived;
  arrived = null;
  return was;
}
