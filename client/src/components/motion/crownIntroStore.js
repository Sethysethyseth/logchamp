import { useSyncExternalStore } from "react";

/* The crown intro's doorbell. Pages ring it (`playCrownIntro`), the host
 * component mounted in App answers. Kept out of React context on purpose:
 * the callers are two auth forms and the host, nothing else needs to know.
 */

let host = null;
let bootPlayed = false;

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** The host registers itself; returns the unregister. */
export function registerCrownIntroHost(play) {
  host = play;
  return () => {
    if (host === play) host = null;
  };
}

/**
 * Start the sign-in intro. Resolves once the screen is fully covered, so the
 * caller can change route underneath without a flash. Resolves at once when
 * nothing will play (reduced motion, no host) - callers never wait on motion
 * that is not coming.
 */
export function playCrownIntro() {
  if (!host || prefersReducedMotion()) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    /* Never let a stuck frame loop hold a signed-in user on the form. */
    setTimeout(done, 1200);
    try {
      host(done);
    } catch {
      done();
    }
  });
}

/** The boot intro plays at most once per page load. */
export function claimBootIntro() {
  if (bootPlayed) return false;
  bootPlayed = true;
  return true;
}

/* ---- Loader -> login hand-off ----
 * The full-page wait's crown notes where it rests; if the login screen
 * mounts right after, its own crown starts there and shrinks into place.
 */
const HANDOFF_WINDOW_MS = 500;
let loaderCrown = null;

/** Called by the loader: its crown's resting box, in viewport px. */
export function noteLoaderCrown(rect) {
  loaderCrown = rect ? { ...rect, at: performance.now() } : null;
}

/** Called by the loader as it leaves: the hand-off window opens now. */
export function stampLoaderCrown() {
  if (loaderCrown) loaderCrown.at = performance.now();
}

/** The loader crown's box if the loader left a moment ago, else null. The
 *  window closes by itself, so reading it twice is harmless. */
export function takeLoaderCrown() {
  const c = loaderCrown;
  if (!c || prefersReducedMotion() || performance.now() - c.at > HANDOFF_WINDOW_MS) return null;
  return c;
}

/* ---- Crown in play ----
 * While someone has the loader's crown in hand or in the air, the boot wait
 * does not end under them: the page waits for the crown to land (it falls
 * off the bottom and the toy resets), then moves on. Set by useCrownThrow.
 */
let crownInPlay = false;
const playListeners = new Set();

export function setCrownInPlay(on) {
  if (crownInPlay === on) return;
  crownInPlay = on;
  playListeners.forEach((fn) => fn());
}

function subscribeCrownInPlay(fn) {
  playListeners.add(fn);
  return () => playListeners.delete(fn);
}

/** True while the loader's crown is held or thrown. */
export function useCrownInPlay() {
  return useSyncExternalStore(subscribeCrownInPlay, () => crownInPlay, () => false);
}
