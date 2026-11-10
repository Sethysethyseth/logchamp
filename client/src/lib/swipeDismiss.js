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

/* ---- Any-direction drag (MXF12, Seth Nov 10: "omnidirectional") ----
 * The numbers from docs/design/mocks/motion/bar-dismiss.html, "Any way".
 * Supersedes the sideways-only rule above for bars that opt in (both do);
 * the sideways helpers stay for the hook's plain mode.
 */

/** The furthest the bar itself ever travels under the finger. */
export const TETHER_PX = 120;
/** Finger distance past which letting go hides the bar. */
export const ARM_PX = 72;

/**
 * Where the bar sits for a finger pulled (dx, dy) from where the drag
 * committed: 1:1 at first, then it lags, never past TETHER_PX.
 *
 * @param {{ dx: number, dy: number }} p
 * @returns {{ tx: number, ty: number, r: number, armed: boolean }}
 */
export function tetherOffset({ dx, dy }) {
  const r = Math.hypot(dx, dy);
  if (!(r > 0)) return { tx: 0, ty: 0, r: 0, armed: false };
  const k = (TETHER_PX * (1 - Math.exp(-r / TETHER_PX))) / r;
  return { tx: dx * k, ty: dy * k, r, armed: r >= ARM_PX };
}

/**
 * What happens on release, in any direction. Velocities are px/ms. A
 * dismiss carries the unit direction the bar leaves in: the way it was
 * thrown, or - for a slow release - the way it was pulled.
 *
 * @param {{ dx: number, dy: number, vx: number, vy: number }} p
 * @returns {{ verdict: "dismiss" | "return", ux: number, uy: number, speed: number }}
 */
export function decideRelease({ dx, dy, vx, vy }) {
  const r = Math.hypot(dx, dy);
  const speed = Math.hypot(vx, vy);
  const outward = r > 0 ? (vx * dx + vy * dy) / r : 0;
  const byDistance = r >= ARM_PX;
  const byFling = r >= FLING_MIN_DISTANCE_PX && outward >= FLING_MIN_VELOCITY_PX_MS;
  let ux = 1;
  let uy = 0;
  if (speed >= 0.3) {
    ux = vx / speed;
    uy = vy / speed;
  } else if (r > 0) {
    ux = dx / r;
    uy = dy / r;
  }
  return {
    verdict: byDistance || byFling ? "dismiss" : "return",
    ux,
    uy,
    speed: Math.min(speed, 1.6),
  };
}
