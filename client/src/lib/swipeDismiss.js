/**
 * Swipe-to-hide decisions for the floating bars (MXF11). Pure: no DOM, no
 * React. `useSwipeDismiss` feeds these from pointer events; the numbers here
 * are the whole contract, so the gesture can be checked without a browser.
 *
 * Sideways only (Seth, Nov 9 2026): a vertical drag belongs to the page
 * scroll and must never move a bar - `lockAxis` is what decides that.
 */

/**
 * Which axis a pointer has committed to, or null while it is still within
 * the slop. "x" wins strict ties toward horizontal only when |dx| > |dy|;
 * an exact diagonal is vertical, so a scroll never turns into a swipe.
 *
 * @param {{ dx: number, dy: number, slop?: number }} p
 * @returns {"x" | "y" | null}
 */
export function lockAxis({ dx, dy, slop = 8 }) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax > slop && ax > ay) return "x";
  if (ay > slop && ay >= ax) return "y";
  return null;
}

/** Fraction of the bar's width the finger must cover for a slow drag. */
export const DISMISS_DISTANCE_RATIO = 0.35;
/** A fling: at least this far AND this fast, in the drag's own direction. */
export const FLING_MIN_DISTANCE_PX = 24;
export const FLING_MIN_VELOCITY_PX_MS = 0.5;

/**
 * What happens on release. `velocityX` is px/ms (positive = rightward).
 *
 * @param {{ dx: number, width: number, velocityX: number }} p
 * @returns {"dismiss" | "return"}
 */
export function decideSwipe({ dx, width, velocityX }) {
  const ax = Math.abs(dx);
  if (Number.isFinite(width) && width > 0 && ax >= width * DISMISS_DISTANCE_RATIO) {
    return "dismiss";
  }
  const v = Number.isFinite(velocityX) ? velocityX : 0;
  const sameDirection = Math.sign(v) === Math.sign(dx) && dx !== 0;
  if (ax >= FLING_MIN_DISTANCE_PX && Math.abs(v) >= FLING_MIN_VELOCITY_PX_MS && sameDirection) {
    return "dismiss";
  }
  return "return";
}
