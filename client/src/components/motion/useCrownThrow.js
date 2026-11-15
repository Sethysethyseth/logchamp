import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

const GRAVITY = 2600; // px / s^2
const RESPAWN_MS = 420;
const MAX_SPEED = 4200;
const MAX_PULL = 30000; // px / s^2 - how hard a jerk of the finger can swing it
const MAX_SPIN = 28; // rad / s
const HELD_DRAG = 3.2; // 1 / s - a held crown swings a few times, then hangs
const AIR_DRAG = 0.35; // 1 / s - a thrown one keeps tumbling
const STEP_DEG = 4; // the crown turns in pixel-art steps, not smoothly

/**
 * The loading crown's easter egg (Seth, Nov 14; physics Nov 15): press the
 * spinning crown on the full-page loader and it is a solid thing hanging
 * from your finger. It pivots on the point you grabbed, so its weight falls
 * below your finger: hold it by the bottom and the top drops over, hold a
 * corner and it dangles from that corner, shake it and it swings. Let go
 * and it flies with whatever speed and spin it had - tumbling, bouncing off
 * the sides of the screen, no ceiling - until it falls under the screen,
 * then a fresh one is back spinning where it started. Nothing else on the
 * page moves or waits for it. Reduced motion: inert.
 *
 * The model is a rigid body in 2D: centre of mass C at the crown's middle,
 * angle `a` (clockwise, screen coordinates), radius of gyration K. Held, it
 * is a pendulum on a moving pivot (the finger): torque = r x (gravity -
 * pivot acceleration), r = pivot -> C. Free, C is a projectile and `a`
 * just turns.
 *
 * Returns a ref for the `.loading-coin` wrapper; `active` is whether the
 * coin is on screen.
 */
export function useCrownThrow(active) {
  const ref = useRef(null);

  useEffect(() => {
    const coin = ref.current;
    const crown = coin?.querySelector(".loading-coin__crown");
    if (!active || !coin || !crown || prefersReducedMotion()) return undefined;

    let raf = 0;
    let timer = 0;
    /* { id, cx0, cy0, half, k2, x, y, a, w, vx, vy,   the body: centre, angle, spin, speed
         gx, gy,                                        the grab point, in the crown's own axes
         px, py, pvx, pvy,                              the finger and its smoothed speed
         trail, last } */
    let toy = null;

    const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

    const paint = () => {
      const deg = Math.round((toy.a * 180) / Math.PI / STEP_DEG) * STEP_DEG;
      crown.style.transform = `translate(${Math.round(toy.x - toy.cx0)}px, ${Math.round(toy.y - toy.cy0)}px) rotate(${deg}deg)`;
    };

    const reset = () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      toy = null;
      crown.style.animation = "";
      crown.style.transform = "";
      crown.style.transformOrigin = "";
      crown.style.visibility = "";
      delete coin.dataset.thrown;
    };

    /* Pivot -> centre, in screen axes, for the current angle. */
    const arm = () => {
      const c = Math.cos(toy.a);
      const s = Math.sin(toy.a);
      return [-(c * toy.gx - s * toy.gy), -(s * toy.gx + c * toy.gy)];
    };

    const held = (dt) => {
      /* The finger's speed, smoothed; its change is what swings the crown. */
      const nvx = (toy.px - toy.lpx) / dt;
      const nvy = (toy.py - toy.lpy) / dt;
      toy.lpx = toy.px;
      toy.lpy = toy.py;
      const svx = toy.pvx + (nvx - toy.pvx) * 0.5;
      const svy = toy.pvy + (nvy - toy.pvy) * 0.5;
      const ax = clamp((svx - toy.pvx) / dt, MAX_PULL);
      const ay = clamp((svy - toy.pvy) / dt, MAX_PULL);
      toy.pvx = svx;
      toy.pvy = svy;
      const [rx, ry] = arm();
      const torque = rx * (GRAVITY - ay) - ry * -ax;
      toy.w = clamp(toy.w + (torque / (toy.k2 + rx * rx + ry * ry)) * dt, MAX_SPIN);
      toy.w *= Math.exp(-HELD_DRAG * dt);
      toy.a += toy.w * dt;
      const [qx, qy] = arm();
      toy.x = toy.px + qx;
      toy.y = toy.py + qy;
    };

    const free = (dt) => {
      toy.vy += GRAVITY * dt;
      toy.x += toy.vx * dt;
      toy.y += toy.vy * dt;
      toy.w *= Math.exp(-AIR_DRAG * dt);
      toy.a += toy.w * dt;
      if (toy.x - toy.half < 0 && toy.vx < 0) {
        toy.x = toy.half;
        toy.vx *= -0.7;
        toy.w = clamp(-toy.w * 0.6 + toy.vy / 160, MAX_SPIN); // the wall scrubs the spin
      } else if (toy.x + toy.half > window.innerWidth && toy.vx > 0) {
        toy.x = window.innerWidth - toy.half;
        toy.vx *= -0.7;
        toy.w = clamp(-toy.w * 0.6 - toy.vy / 160, MAX_SPIN);
      }
    };

    const tick = (now) => {
      if (!toy) return;
      const dt = Math.max(0.001, Math.min(0.05, (now - toy.last) / 1000));
      toy.last = now;
      if (toy.id != null) held(dt);
      else {
        free(dt);
        if (toy.y - toy.half > window.innerHeight + 24) {
          crown.style.visibility = "hidden";
          timer = window.setTimeout(reset, RESPAWN_MS);
          return;
        }
      }
      paint();
      raf = requestAnimationFrame(tick);
    };

    const onDown = (e) => {
      if (toy || e.button > 0) return;
      const seen = crown.getBoundingClientRect(); // mid-toss, as drawn
      crown.style.animation = "none";
      crown.style.transformOrigin = "50% 50%";
      const home = crown.getBoundingClientRect(); // at rest
      const cx0 = home.left + home.width / 2;
      const cy0 = home.top + home.height / 2;
      const x = cx0;
      const y = seen.top + seen.height / 2;
      const half = home.width / 2;
      /* Grabbed dead centre there is no arm to swing on: nudge the grab a
         hair, so even then it settles like a thing with weight. */
      let gx = e.clientX - x;
      let gy = e.clientY - y;
      if (Math.hypot(gx, gy) < 3) gy = -3;
      const now = performance.now();
      toy = {
        id: e.pointerId,
        cx0,
        cy0,
        half,
        k2: (home.width * 0.3) ** 2,
        x,
        y,
        a: 0,
        /* Held from underneath it stands balanced on the finger: tip it. */
        w: gy > 0 ? (gx >= 0 ? -1.2 : 1.2) : 0,
        vx: 0,
        vy: 0,
        gx,
        gy,
        px: e.clientX,
        py: e.clientY,
        lpx: e.clientX,
        lpy: e.clientY,
        pvx: 0,
        pvy: 0,
        trail: [[now, e.clientX, e.clientY]],
        last: now,
      };
      coin.dataset.thrown = "";
      try {
        coin.setPointerCapture(e.pointerId);
      } catch {
        /* the moves still arrive while the finger stays on the coin */
      }
      paint();
      raf = requestAnimationFrame(tick);
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!toy || toy.id !== e.pointerId) return;
      const now = performance.now();
      toy.px = e.clientX;
      toy.py = e.clientY;
      toy.trail.push([now, toy.px, toy.py]);
      while (toy.trail.length > 2 && now - toy.trail[0][0] > 90) toy.trail.shift();
    };

    const onUp = (e) => {
      if (!toy || toy.id !== e.pointerId) return;
      const now = performance.now();
      const [t0, x0, y0] = toy.trail[0];
      const dt = Math.max(0.016, (now - t0) / 1000);
      /* The centre leaves with the finger's speed plus its own swing. */
      const [rx, ry] = arm();
      toy.vx = clamp((toy.px - x0) / dt - toy.w * ry, MAX_SPEED);
      toy.vy = clamp((toy.py - y0) / dt + toy.w * rx, MAX_SPEED);
      toy.id = null;
    };

    coin.addEventListener("pointerdown", onDown);
    coin.addEventListener("pointermove", onMove);
    coin.addEventListener("pointerup", onUp);
    coin.addEventListener("pointercancel", onUp);
    coin.addEventListener("lostpointercapture", onUp);
    return () => {
      coin.removeEventListener("pointerdown", onDown);
      coin.removeEventListener("pointermove", onMove);
      coin.removeEventListener("pointerup", onUp);
      coin.removeEventListener("pointercancel", onUp);
      coin.removeEventListener("lostpointercapture", onUp);
      reset();
    };
  }, [active]);

  return ref;
}
