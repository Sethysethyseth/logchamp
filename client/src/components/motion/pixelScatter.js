/* The bar-dismiss exit (MXF12, ported from docs/design/mocks/motion/
 * bar-dismiss.html, option C "Goes Home"). A swiped bar becomes a grid of
 * square pixels in its own colours; the dissolve sweeps across it from the
 * leading edge and the pixels drift off the way it was thrown. With
 * `toHome`, the accent pixels do not fade: they fly to the Home tab and
 * ping it - "the workout is still there".
 *
 * One throwaway canvas on <body> per exit; it removes itself when the last
 * pixel dies. Colours come from the live tokens. No React.
 */

const CELL_PX = 6;
const SWEEP_MS = 170;
const CORNER_PX = 14;

function tokenColors() {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const read = (token) => {
    probe.style.color = `var(${token})`;
    return getComputedStyle(probe).color;
  };
  const colors = {
    surface: read("--color-surface-2"),
    edge: read("--color-border"),
    accent: read("--color-interactive"),
  };
  probe.remove();
  return colors;
}

/* Where the bar's words are, so the pixel grid carries their ink. */
function inkRects(el) {
  const out = [];
  el.querySelectorAll("span, strong, b").forEach((node) => {
    if (node.children.length || !node.textContent.trim()) return;
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const inset = r.height * 0.26;
    out.push({ l: r.left, r: r.right, t: r.top + inset, b: r.bottom - inset, c: getComputedStyle(node).color });
  });
  return out;
}

function homeTarget() {
  const icon = document.querySelector(".bottom-nav .bottom-nav__item .bottom-nav__icon");
  if (!icon) return null;
  const r = icon.getBoundingClientRect();
  if (!r.width || !r.height) return null; // desktop: the bottom nav is not shown
  return { icon, x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * @param {HTMLElement} el  the bar, wherever the finger left it
 * @param {{ ux?: number, speed?: number, toHome?: boolean, accentSelector?: string }} [o]
 *   `ux`, `uy` the unit direction it was thrown; `speed` px/ms; `accentSelector` marks
 *   extra accent pixels inside the bar (the coach crown).
 */
export function scatterBar(el, { ux = 1, uy = 0, speed = 0, toHome = false, accentSelector } = {}) {
  const R = el.getBoundingClientRect();
  if (!R.width || !R.height) return;
  const colors = tokenColors();
  const inks = inkRects(el);
  const accentEl = accentSelector ? el.querySelector(accentSelector) : null;
  const accentRect = accentEl ? accentEl.getBoundingClientRect() : null;
  const liveEdge = el.classList.contains("card--live");
  const home = toHome ? homeTarget() : null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:1400;pointer-events:none";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  document.body.appendChild(canvas);

  const cols = Math.max(1, Math.round(R.width / CELL_PX));
  const rows = Math.max(1, Math.round(R.height / CELL_PX));
  const cw = R.width / cols;
  const ch = R.height / rows;
  const mx = R.left + R.width / 2;
  const my = R.top + R.height / 2;
  const start = performance.now();
  const boost = Math.min(1.5, Math.abs(speed));
  const ext = (Math.abs(ux) * R.width) / 2 + (Math.abs(uy) * R.height) / 2 || 1;
  const parts = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = R.left + c * cw;
      const y = R.top + r * ch;
      const cx = x + cw / 2;
      const cy = y + ch / 2;
      /* skip the pixels outside the rounded corners */
      const qx = Math.min(cx - R.left, R.right - cx);
      const qy = Math.min(cy - R.top, R.bottom - cy);
      if (qx < CORNER_PX && qy < CORNER_PX && (CORNER_PX - qx) ** 2 + (CORNER_PX - qy) ** 2 > CORNER_PX ** 2) {
        continue;
      }
      let color = colors.surface;
      let accent = false;
      if (liveEdge && c === 0) {
        color = colors.accent;
        accent = true;
      } else if (accentRect && cx > accentRect.left && cx < accentRect.right && cy > accentRect.top && cy < accentRect.bottom) {
        color = colors.accent;
        accent = true;
      } else if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        color = colors.edge;
      } else {
        for (const ink of inks) {
          if (cx > ink.l && cx < ink.r && cy > ink.t && cy < ink.b) {
            if (Math.random() < 0.66) color = ink.c;
            break;
          }
        }
      }
      const lead = (((cx - mx) * ux + (cy - my) * uy) / ext + 1) / 2; // 0 trailing .. 1 leading
      const delay = (1 - lead) * SWEEP_MS + Math.random() * 50;
      if (home && accent) {
        parts.push({
          home: true,
          c: color,
          x,
          y,
          w: cw,
          h: ch,
          t0: start + delay + 40,
          dur: 430 + Math.random() * 170,
          sx: cx,
          sy: cy,
          kx: cx + ux * 90 + (Math.random() - 0.5) * 50,
          ky: cy + uy * 90 - 30 - Math.random() * 40,
          ex: home.x + (Math.random() - 0.5) * 6,
          ey: home.y + (Math.random() - 0.5) * 6,
        });
        continue;
      }
      const base = 0.15 + Math.random() * 0.4 + boost * 0.2;
      const spread = (Math.random() - 0.5) * 0.32;
      parts.push({
        c: color,
        x,
        y,
        w: cw,
        h: ch,
        t0: start + delay,
        life: 340 + Math.random() * 300,
        vx: ux * base - uy * spread + ((cx - mx) / R.width) * 0.06,
        vy: uy * base + ux * spread + ((cy - my) / R.height) * 0.06,
      });
    }
  }

  let landed = false;
  function land() {
    if (landed || !home) return;
    landed = true;
    home.icon.classList.remove("bottom-nav__icon--pinged");
    void home.icon.getBoundingClientRect(); // restart the pop
    home.icon.classList.add("bottom-nav__icon--pinged");
    try {
      navigator.vibrate?.(12);
    } catch {
      /* no haptics here - fine */
    }
  }

  let last = start;
  function step(now) {
    const dt = Math.min(34, now - last);
    last = now;
    ctx.clearRect(0, 0, vw, vh);
    let alive = 0;
    for (const p of parts) {
      if (p.dead) continue;
      const age = now - p.t0;
      if (age < 0) {
        /* Not yet reached by the sweep: still part of the bar. */
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.w), Math.ceil(p.h));
        alive += 1;
        continue;
      }
      if (p.home) {
        const t = age / p.dur;
        if (t >= 1) {
          p.dead = true;
          land();
          continue;
        }
        ctx.fillStyle = p.c;
        for (let j = 2; j >= 0; j -= 1) {
          /* the pixel and a two-step trail */
          const a = Math.max(0, t - j * 0.05);
          const e = a < 0.5 ? 2 * a * a : 1 - (-2 * a + 2) ** 2 / 2;
          const px = (1 - e) * (1 - e) * p.sx + 2 * (1 - e) * e * p.kx + e * e * p.ex;
          const py = (1 - e) * (1 - e) * p.sy + 2 * (1 - e) * e * p.ky + e * e * p.ey;
          const s = j === 0 ? 5 : 4;
          ctx.globalAlpha = j === 0 ? 1 : j === 1 ? 0.4 : 0.18;
          ctx.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s);
        }
        alive += 1;
        continue;
      }
      const k = age / p.life;
      if (k >= 1) {
        p.dead = true;
        continue;
      }
      const f = 0.93 ** (dt / 16.67);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= f;
      p.vy *= f;
      const w = Math.max(1, Math.round(p.w * (1 - 0.7 * k)));
      const h = Math.max(1, Math.round(p.h * (1 - 0.7 * k)));
      ctx.globalAlpha = 0.95 * (1 - k * k);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x + (p.w - w) / 2), Math.round(p.y + (p.h - h) / 2), w, h);
      alive += 1;
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(step);
    else canvas.remove();
  }
  requestAnimationFrame(step);
}

/**
 * While a bar is held past the let-go distance it drops a few pixels off
 * its edges: "let go and I am dust". One small canvas for the life of the
 * drag; call `shed(el)` on pointer moves (it throttles itself) and `stop()`
 * when the drag ends - it removes itself once the last pixel has fallen.
 */
export function createShedder() {
  let canvas = null;
  let ctx = null;
  let colors = null;
  let parts = [];
  let raf = 0;
  let last = 0;
  let lastShed = 0;
  let stopped = false;

  function step(now) {
    raf = 0;
    const dt = Math.min(34, now - last);
    last = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    parts = parts.filter((p) => now - p.t0 < p.life);
    for (const p of parts) {
      const k = (now - p.t0) / p.life;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = 0.9 * (1 - k * k);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 4, 4);
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(step);
    else if (stopped && canvas) {
      canvas.remove();
      canvas = null;
    }
  }

  return {
    shed(el) {
      const now = performance.now();
      if (stopped || now - lastShed < 48) return;
      lastShed = now;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText =
          "position:fixed;inset:0;width:100%;height:100%;z-index:1400;pointer-events:none";
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        document.body.appendChild(canvas);
        colors = tokenColors();
      }
      const r = el.getBoundingClientRect();
      for (let i = 0; i < 2; i += 1) {
        const along = Math.random() < 0.7;
        parts.push({
          x: along ? r.left + Math.random() * r.width : Math.random() < 0.5 ? r.left : r.right - 4,
          y: along ? r.bottom - 3 : r.top + Math.random() * r.height,
          c: Math.random() < 0.3 ? colors.accent : colors.edge,
          t0: now,
          life: 300 + Math.random() * 180,
          vx: (Math.random() - 0.5) * 0.07,
          vy: 0.03 + Math.random() * 0.07,
        });
      }
      if (!raf) {
        last = now;
        raf = requestAnimationFrame(step);
      }
    },
    stop() {
      stopped = true;
      if (!parts.length && canvas) {
        cancelAnimationFrame(raf);
        canvas.remove();
        canvas = null;
      }
    },
  };
}
