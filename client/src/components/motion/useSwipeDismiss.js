import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { decideRelease, decideSwipe, lockAxis, tetherOffset } from "../../lib/swipeDismiss.js";
import { useReducedMotion } from "../../lib/useReducedMotion.js";
import { createShedder, scatterBar } from "./pixelScatter.js";

/**
 * Swipe a floating bar sideways to hide it (MXF11). Shared by the
 * resume-workout bar and the coach bar. Zero deps: pointer events plus
 * inline transform/opacity, timed by the `--mx-*` tokens.
 *
 * Feel:
 * - Undecided until the pointer clears the slop. A vertical lock abandons
 *   the gesture (the element's `touch-action: pan-y` keeps the page
 *   scrolling); a horizontal lock takes pointer capture and the bar follows
 *   the finger 1:1, fading with distance.
 * - Release: `decideSwipe` -> dismiss throws the bar out in the drag's
 *   direction (exit = 0.6x reveal, out-expo - exits are faster than
 *   entries) then calls `onDismiss`; return springs it home
 *   (`--mx-ease-spring`, overshoot <= 1.15x). Pointer cancel springs back.
 * - A gesture that locked to x swallows the click it started on (Resume,
 *   open coach, the X). A tap (no lock) clicks normally.
 * - Reduced motion (`useReducedMotion`): identical recognition, zero
 *   motion. Past the threshold the bar is simply gone; under it nothing
 *   ever moved.
 *
 * The hook writes styles straight to the element on pointermove (no React
 * state per frame) so a mid-range phone keeps 60fps under the finger.
 *
 * - `scatter` (MXF12, Seth Nov 10): the bar can be dragged ANY way, not
 *   just sideways (`touch-action: none` - a drag that starts on the bar
 *   moves the bar, never the page). It is tethered: 1:1 at first, then it
 *   lags, never past TETHER_PX, tilting a little with the pull. Past ARM_PX
 *   it "lets go" (tightens, dims, one haptic tick). Release there, or
 *   flick, and it breaks into pixels that leave the way it was thrown;
 *   with `toHome` its accent pixels fly to the Home tab. Otherwise it
 *   springs back. Reduced motion: same recognition, zero motion.
 *
 * @param {{ onDismiss?: () => void, resetKey?: unknown, scatter?: { toHome?: boolean, accentSelector?: string } }} opts
 *   `resetKey` - when it changes, any thrown-out / mid-gesture styling is
 *   cleared. Pass the identity of what the bar shows (session id, coach
 *   phase+beat) so a bar that comes back on the SAME element starts clean.
 * @returns {{ ref: import("react").RefObject<HTMLElement>, handlers: object }}
 */

const SLOP_PX = 8;
const VELOCITY_WINDOW_MS = 100;
const MAX_SAMPLES = 8;
const CLICK_SUPPRESS_MS = 400;
const END_FALLBACK_MS = 700;
const EXIT_OVERSHOOT_PX = 48;

const EXIT_TRANSITION =
  "transform calc(var(--mx-reveal) * 0.6) var(--mx-ease-out-expo), " +
  "opacity calc(var(--mx-reveal) * 0.6) var(--mx-ease-out-expo)";
const RETURN_TRANSITION =
  "transform calc(var(--mx-reveal) * 0.75) var(--mx-ease-spring), " +
  "opacity calc(var(--mx-reveal) * 0.5) var(--mx-ease-out-expo)";

/* Fades with distance: half gone at the 35% threshold, nearly clear by 70%
   of the width. Never fully invisible under the finger - the throw-out
   finishes the fade. */
function followOpacity(dx, width) {
  const w = width > 0 ? width : 1;
  return Math.max(0.08, 1 - Math.abs(dx) / (w * 0.7));
}

function pushSample(gesture, x, y = 0) {
  const t = performance.now();
  gesture.samples.push({ t, x, y });
  if (gesture.samples.length > MAX_SAMPLES) gesture.samples.shift();
}

/* px/ms over the last ~100ms of movement. A finger that stops before
   lifting reads as ~0, so a slow drag only dismisses on distance. */
function velocityOf(gesture) {
  const samples = gesture.samples;
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let first = last;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (last.t - samples[i].t > VELOCITY_WINDOW_MS) break;
    first = samples[i];
  }
  const dt = last.t - first.t;
  if (dt < 1) return 0;
  return (last.x - first.x) / dt;
}

/* Any-direction mode: velocity on both axes over the same window. */
function velocityXY(gesture) {
  const s = gesture.samples;
  const last = s[s.length - 1];
  if (!last) return { vx: 0, vy: 0 };
  let first = last;
  for (let i = s.length - 1; i >= 0; i -= 1) {
    if (last.t - s[i].t > VELOCITY_WINDOW_MS) break;
    first = s[i];
  }
  const dt = last.t - first.t;
  if (dt < 1) return { vx: 0, vy: 0 };
  return { vx: (last.x - first.x) / dt, vy: ((last.y ?? 0) - (first.y ?? 0)) / dt };
}

function hapticTick() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* no haptics here - fine */
  }
}

function clearInline(el) {
  el.style.transition = "";
  el.style.transform = "";
  el.style.opacity = "";
  el.removeAttribute("data-swipe");
}

export function useSwipeDismiss({ onDismiss, resetKey, scatter } = {}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const onDismissRef = useRef(onDismiss);
  const reducedRef = useRef(reduced);
  const scatterRef = useRef(scatter);
  /* { pointerId, startX, startY, axis, width, samples, captured } */
  const gestureRef = useRef(null);
  /* idle | drag | return | dismiss | gone */
  const phaseRef = useRef("idle");
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(0);
  const endTimerRef = useRef(0);
  const endListenerRef = useRef(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
    reducedRef.current = reduced;
    scatterRef.current = scatter;
  });

  /* Any-direction bars own every drag that starts on them. */
  const anyDirection = Boolean(scatter);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anyDirection) return undefined;
    el.style.touchAction = "none";
    return () => {
      el.style.touchAction = "";
    };
  });

  const clearEnd = useCallback(() => {
    if (endTimerRef.current) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = 0;
    }
    const l = endListenerRef.current;
    if (l) {
      l.el.removeEventListener("transitionend", l.onEnd);
      endListenerRef.current = null;
    }
  }, []);

  const armClickSuppress = useCallback(() => {
    suppressClickRef.current = true;
    if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressTimerRef.current = 0;
    }, CLICK_SUPPRESS_MS);
  }, []);

  const releaseCapture = useCallback((gesture) => {
    const el = ref.current;
    if (!el || !gesture?.captured) return;
    try {
      if (el.hasPointerCapture(gesture.pointerId)) el.releasePointerCapture(gesture.pointerId);
    } catch {
      /* capture optional */
    }
  }, []);

  const settle = useCallback(
    (kind) => {
      clearEnd();
      const el = ref.current;
      if (kind === "return") {
        if (el) clearInline(el);
        phaseRef.current = "idle";
        return;
      }
      if (el) {
        el.style.transition = "";
        el.setAttribute("data-swipe", "gone");
      }
      phaseRef.current = "gone";
      onDismissRef.current?.();
    },
    [clearEnd]
  );

  const awaitEnd = useCallback(
    (el, kind) => {
      clearEnd();
      const done = () => settle(kind);
      const onEnd = (e) => {
        if (e.target !== el || e.propertyName !== "transform") return;
        done();
      };
      el.addEventListener("transitionend", onEnd);
      endListenerRef.current = { el, onEnd };
      endTimerRef.current = window.setTimeout(done, END_FALLBACK_MS);
    },
    [clearEnd, settle]
  );

  const springBack = useCallback(
    (el, dx) => {
      if (reducedRef.current) {
        /* Nothing moved, nothing to put back. */
        if (phaseRef.current === "drag") phaseRef.current = "idle";
        el.removeAttribute("data-swipe");
        return;
      }
      if (Math.abs(dx) < 1) {
        settle("return");
        return;
      }
      phaseRef.current = "return";
      el.setAttribute("data-swipe", "return");
      el.style.transition = RETURN_TRANSITION;
      el.style.transform = "";
      el.style.opacity = "";
      awaitEnd(el, "return");
    },
    [awaitEnd, settle]
  );

  const throwOut = useCallback(
    (el, dx, width, velocity = 0) => {
      const sign = dx < 0 ? -1 : 1;
      if (reducedRef.current) {
        /* Reduced: no throw - past the threshold it is simply gone. */
        phaseRef.current = "gone";
        el.setAttribute("data-swipe", "gone");
        onDismissRef.current?.();
        return;
      }
      if (scatterRef.current) {
        /* The canvas takes over from exactly where the bar is; the bar
           itself is done. */
        scatterBar(el, { ux: sign, speed: velocity, ...scatterRef.current });
        el.style.transition = "";
        el.style.opacity = "0";
        el.setAttribute("data-swipe", "gone");
        phaseRef.current = "gone";
        onDismissRef.current?.();
        return;
      }
      phaseRef.current = "dismiss";
      el.setAttribute("data-swipe", "dismiss");
      el.style.transition = EXIT_TRANSITION;
      el.style.transform = `translateX(${sign * (width + EXIT_OVERSHOOT_PX)}px)`;
      el.style.opacity = "0";
      awaitEnd(el, "dismiss");
    },
    [awaitEnd]
  );

  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      const el = ref.current;
      if (!el) return;
      const phase = phaseRef.current;
      if (phase === "dismiss" || phase === "gone") return;
      if (phase === "return") {
        /* Grabbed mid-spring: snap home and start fresh from the finger. */
        clearEnd();
        clearInline(el);
        phaseRef.current = "idle";
      }
      const width = el.getBoundingClientRect().width || el.offsetWidth || 1;
      gestureRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        axis: null,
        width,
        samples: [],
        captured: false,
      };
      pushSample(gestureRef.current, e.clientX);
    },
    [clearEnd]
  );

  const onPointerMove = useCallback(
    (e) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== e.pointerId) return;
      const el = ref.current;
      if (!el) return;
      if (scatterRef.current) {
        /* Any-direction drag. */
        if (!g.axis) {
          if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) <= SLOP_PX) return;
          g.axis = "any";
          /* Measure from where the drag committed, so the bar never jumps. */
          g.startX = e.clientX;
          g.startY = e.clientY;
          armClickSuppress();
          try {
            el.setPointerCapture(e.pointerId);
            g.captured = true;
          } catch {
            /* capture optional */
          }
          if (!reducedRef.current) {
            phaseRef.current = "drag";
            el.setAttribute("data-swipe", "drag");
            el.style.transition = "none";
          }
        }
        pushSample(g, e.clientX, e.clientY);
        const t = tetherOffset({ dx: e.clientX - g.startX, dy: e.clientY - g.startY });
        if (t.armed !== Boolean(g.armed)) {
          g.armed = t.armed;
          if (t.armed) hapticTick();
          if (!reducedRef.current) el.toggleAttribute("data-swipe-armed", t.armed);
        }
        g.tx = t.tx;
        g.ty = t.ty;
        if (reducedRef.current) return;
        const tilt = Math.max(-3, Math.min(3, t.tx * 0.035));
        const scale = t.armed ? 0.965 : 1.02;
        el.style.transform = `translate3d(${t.tx.toFixed(1)}px,${t.ty.toFixed(1)}px,0) rotate(${tilt.toFixed(2)}deg) scale(${scale})`;
        el.style.opacity = String(t.armed ? 0.62 : 1 - 0.22 * (t.r / 72));
        if (t.armed) {
          g.shedder ??= createShedder();
          g.shedder.shed(el);
        }
        return;
      }
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (!g.axis) {
        const axis = lockAxis({ dx, dy, slop: SLOP_PX });
        if (!axis) return;
        if (axis === "y") {
          /* The page owns this one. Forget the pointer entirely. */
          gestureRef.current = null;
          return;
        }
        g.axis = "x";
        armClickSuppress();
        try {
          el.setPointerCapture(e.pointerId);
          g.captured = true;
        } catch {
          /* capture optional */
        }
        if (!reducedRef.current) {
          phaseRef.current = "drag";
          el.setAttribute("data-swipe", "drag");
          el.style.transition = "none";
        }
      }
      pushSample(g, e.clientX);
      if (reducedRef.current) return;
      el.style.transform = `translateX(${dx}px)`;
      el.style.opacity = String(followOpacity(dx, g.width));
    },
    [armClickSuppress]
  );

  const onPointerUp = useCallback(
    (e) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== e.pointerId) return;
      gestureRef.current = null;
      /* A tap: the click goes through untouched. */
      if (!g.axis) return;
      const el = ref.current;
      releaseCapture(g);
      if (!el) return;
      if (g.axis === "any") {
        pushSample(g, e.clientX, e.clientY);
        el.removeAttribute("data-swipe-armed");
        g.shedder?.stop();
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        const out = decideRelease({ dx, dy, ...velocityXY(g) });
        if (out.verdict !== "dismiss") {
          springBack(el, Math.hypot(dx, dy));
          return;
        }
        if (!reducedRef.current) {
          /* Square the bar up where it is, then hand it to the canvas. */
          el.style.transform = `translate3d(${(g.tx || 0).toFixed(1)}px,${(g.ty || 0).toFixed(1)}px,0)`;
          scatterBar(el, { ux: out.ux, uy: out.uy, speed: out.speed, ...scatterRef.current });
          el.style.transition = "";
          el.style.opacity = "0";
        }
        el.setAttribute("data-swipe", "gone");
        phaseRef.current = "gone";
        onDismissRef.current?.();
        return;
      }
      pushSample(g, e.clientX);
      const dx = e.clientX - g.startX;
      const velocityX = velocityOf(g);
      const verdict = decideSwipe({ dx, width: g.width, velocityX });
      if (verdict === "dismiss") throwOut(el, dx, g.width, velocityX);
      else springBack(el, dx);
    },
    [releaseCapture, springBack, throwOut]
  );

  const onPointerCancel = useCallback(
    (e) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== e.pointerId) return;
      gestureRef.current = null;
      if (!g.axis) return;
      const el = ref.current;
      releaseCapture(g);
      if (!el) return;
      el.removeAttribute("data-swipe-armed");
      g.shedder?.stop();
      springBack(el, g.axis === "any" ? Math.hypot(g.tx || 0, g.ty || 0) : e.clientX - g.startX);
    },
    [releaseCapture, springBack]
  );

  /* Capture phase on the root: runs before the Resume / open / X button's
     own onClick, so a horizontal gesture never fires the thing it began on. */
  const onClickCapture = useCallback((e) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
    if (suppressTimerRef.current) {
      window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = 0;
    }
  }, []);

  /* Same element, new content (the coach bar coming back as "answered"
     before its close animation unmounted it): start from a clean slate. */
  useLayoutEffect(() => {
    clearEnd();
    gestureRef.current = null;
    phaseRef.current = "idle";
    const el = ref.current;
    if (el) clearInline(el);
  }, [resetKey, clearEnd]);

  useEffect(
    () => () => {
      clearEnd();
      if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
    },
    [clearEnd]
  );

  const handlers = useMemo(
    () => ({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture }),
    [onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture]
  );

  return { ref, handlers };
}
