/* Arena view (beta) - the stage. One low-res canvas draws a continuous
 * arena; the camera sits on the place that matches the current route.
 * Ported from docs/design/mocks/motion/arena-ui-v2.html and arena-draft-2.html.
 *
 * - One motion: the canvas is always the full-view frame and the camera's
 *   height never changes - the floor sits FLOOR_MARGIN rows above the
 *   canvas's bottom edge. The stage element rides the sheet's edge; the
 *   camera only walks sideways.
 * - The strip: a second, flat canvas - the scoreboard on its own - shown
 *   when the stage is down to strip height.
 * - Colours: a 9-step ramp mixed from --color-interactive at runtime, so
 *   every palette (and a custom one) relights the same room. No literals.
 * - Cost: nothing runs at rest. A frame loop exists only while the camera
 *   walks, the lights ease or a flash runs; a clock redraws once a second.
 *   Hidden tab or covered stage = no room drawing; a hidden strip = none.
 * - Reduced motion: the camera cuts, lights switch, nothing flickers.
 */

import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

const FLOOR = 150;
const FLOOR_MARGIN = 7;
const FACE_MS = 4200;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CROWN = ["....#....", "#...#...#", "##.###.##", "#########", "#########", ".#######."];
const FONT = {
  0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
  5: "111100111001111", 6: "111100111101111", 7: "111001001001001", 8: "111101111101111", 9: "111101111001111",
  A: "111101111101101", B: "110101110101110", C: "111100100100111", D: "110101101101110", E: "111100111100111",
  F: "111100111100100", G: "111100101101111", H: "101101111101101", I: "111010010010111", J: "001001001101111",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "111101101101101", O: "111101101101111",
  P: "111101111100100", Q: "111101101111001", R: "111101110101101", S: "111100111001111", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", ":": "000010000010000",
};

/** Where each place sits in the world: the x of its centre. The camera never moves vertically. */
export const ARENA_PLACES = {
  history: { x: 46 },
  home: { x: 150 },
  analytics: { x: 150 },
  coach: { x: 254 },
  library: { x: 358 },
  profile: { x: 450 },
};

const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/* Seats in the near stands, front row first: one lights per finished workout. */
const SEATS = [];
for (let tier = 0; tier < 22; tier += 1) {
  const reach = Math.round(92 - tier * 2.6);
  for (let x = reach - 3; x > 0; x -= 2) SEATS.push({ x, y: FLOOR - 2 - tier * 4 });
}

function readRamp() {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const mix = (pct, into) => {
    probe.style.color = `color-mix(in srgb, var(--color-interactive) ${pct}%, ${into})`;
    return getComputedStyle(probe).color;
  };
  const ramp = [5, 9, 14, 21, 31, 45, 64, 100].map((p) => mix(p, "black"));
  ramp.push(mix(30, "white"));
  probe.remove();
  return ramp;
}

function ledText(value, max) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9: ]/g, "")
    .trim()
    .slice(0, max);
}

const clockText = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:${String(t % 60).padStart(2, "0")}`;
};
const restText = (left) => {
  const sec = Math.ceil(left / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export function createArena(canvas, strip) {
  const roomG = canvas.getContext("2d");
  const stripG = strip ? strip.getContext("2d") : null;
  let g = roomG;
  let RAMP = readRamp();
  let W = 100;
  let H = 80;
  let SH = 30;
  let raf = 0;
  let clock = 0;
  let cycle = 0;
  let lastT = 0;
  let stripSig = "";
  let dead = false;
  const cam = { x: 100, y: 0, ready: false };
  const walk = { from: 0, to: 0, t0: 0, dur: 0 };
  const ease = { power: 0.5, board: 0 };
  const s = {
    place: "home",
    facet: null, // what the strip reads off the route: home | analytics | history | coach | null
    live: null, // { startedAtMs, sets }
    rest: null, // { startedAtMs, durationMs }
    week: { days: [0, 0, 0, 0, 0, 0, 0], sets: 0, workouts: 0 },
    bars: [0, 0, 0, 0, 0, 0, 0, 0],
    seats: 0,
    savedUntil: 0,
    savedName: "",
    flashUntil: 0,
    covered: false,
    strip: false,
  };

  let cx = 0;
  let cy = 0;
  const px = (x, y, c, w = 1, h = 1) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x - cx), Math.round(y - cy), w, h);
  };
  const text = (str, x, y, c, k = 1) => {
    [...str].forEach((ch, i) => {
      const gl = FONT[ch];
      if (!gl) return;
      for (let n = 0; n < 15; n += 1) {
        if (gl[n] === "1") px(x + (i * 4 + (n % 3)) * k, y + Math.floor(n / 3) * k, c, k, k);
      }
    });
  };
  const mid = (str, m, y, c, k = 1) => text(str, Math.round(m - ((str.length * 4 - 1) * k) / 2), y, c, k);
  const crown = (x, y, c) =>
    CROWN.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === "#") px(x + rx, y + ry, c);
      })
    );
  const light = (x, y, tx, ty, half, p) => ({ x, y, half, p, ax: tx - x, ay: ty - y, len: Math.hypot(tx - x, ty - y) });

  function field(x, y, lights) {
    let v =
      0.05 +
      0.18 * Math.pow(Math.max(0, Math.min(1, (y - 40) / (FLOOR - 40))), 2) -
      (y > FLOOR ? 0.02 * (y - FLOOR) : 0);
    for (const l of lights) {
      const qx = x - l.x;
      const qy = y - l.y;
      const d = Math.hypot(qx, qy);
      if (d < 1 || d > l.len * 1.3) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (qx * l.ax + qy * l.ay) / (d * l.len))));
      if (ang < l.half) v += l.p * 0.7 * Math.pow(1 - ang / l.half, 1.3) * (1 - 0.35 * (d / l.len));
      v += l.p * 0.5 * Math.max(0, 1 - d / 8);
    }
    const ex = (x - 150) / 30;
    const ey = (y - (FLOOR + 3)) / 7;
    return v + Math.max(0, 1 - (ex * ex + ey * ey)) * 0.8 * ease.power;
  }

  function restLeft(now) {
    if (!s.live || !s.rest) return 0;
    return Math.max(0, s.rest.startedAtMs + s.rest.durationMs - now);
  }

  function targetX() {
    const place = ARENA_PLACES[s.place] || ARENA_PLACES.home;
    // Never look past the ends of the room; a view wider than the room centres it.
    return W >= 500 ? 250 - W / 2 : Math.max(-4, Math.min(504 - W, place.x - W / 2));
  }

  function draw(now) {
    cx = cam.x;
    cy = cam.y;
    const at = (p) => s.place === p;
    const lights = [
      light(112, 88, 150, 148, 0.44, ease.power),
      light(188, 88, 150, 148, 0.44, ease.power),
      light(60, 62, 40, 150, 0.6, at("history") ? 0.5 : 0.3),
      light(254, 84, 254, 150, 0.62, at("coach") ? 0.85 : 0.4),
      light(358, 84, 358, 150, 0.7, at("library") ? 0.8 : 0.35),
      light(450, 84, 450, 150, 0.7, at("profile") ? 0.8 : 0.35),
    ].filter((l) => l.x > cx - 70 && l.x < cx + W + 70);
    const lit = ease.power > 0.85;
    const flashing = now < s.flashUntil;

    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const v = Math.max(0, Math.min(0.999, field(x + cx, y + cy, lights))) * (RAMP.length - 2);
        const lo = Math.floor(v);
        g.fillStyle = RAMP[v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? lo + 1 : lo];
        g.fillRect(x, y, 1, 1);
      }
    }

    // far stands behind the platform
    for (let row = 0; row < 6; row += 1) {
      for (let x = 98; x < 204; x += 2) {
        const on = hash(x, row) < 0.3;
        px(x, FLOOR - 34 + row * 4, flashing && Math.random() < 0.07 ? RAMP[8] : on ? RAMP[4] : RAMP[2]);
      }
    }
    px(96, FLOOR - 9, RAMP[3], 110, 1);

    // near stands (History): one lit seat per finished workout
    for (let tier = 0; tier < 22; tier += 1) {
      const y = FLOOR - 4 - tier * 4;
      const reach = Math.round(92 - tier * 2.6);
      px(0, y, RAMP[1], reach, 4);
      px(0, y, RAMP[3], reach, 1);
    }
    SEATS.forEach((seat, i) => px(seat.x, seat.y, i < s.seats ? (i === s.seats - 1 ? RAMP[8] : RAMP[6]) : RAMP[2]));

    px(-400, FLOOR, RAMP[4], 1400, 1);

    // platform and bar; plates load as sets are logged
    px(132, FLOOR - 2, RAMP[5], 36, 2);
    px(134, FLOOR, RAMP[3], 32, 2);
    px(134, FLOOR - 6, lit ? RAMP[8] : RAMP[6], 32, 1);
    const plates = s.live ? Math.min(4, 1 + Math.floor(s.live.sets / 3)) : 1;
    for (let i = 0; i < plates; i += 1) {
      for (const x of [137 + i * 3, 161 - i * 3]) {
        px(x, FLOOR - 10 + i, i ? RAMP[5] : lit ? RAMP[7] : RAMP[5], 2, 9 - i * 2);
      }
    }
    for (const tx of [112, 188]) {
      px(tx, 90, RAMP[4], 1, FLOOR - 90);
      px(tx - 3, 86, RAMP[2], 7, 4);
      for (let k = 0; k < 3; k += 1) px(tx - 2 + k * 2, 87, lit || k === 1 ? RAMP[8] : RAMP[5], 1, 2);
    }

    // scoreboard; on Analytics it drops and widens into the weekly board
    const b = ease.board;
    const bw = Math.round(38 + 46 * b);
    const bh = Math.round(17 + 35 * b);
    const bx = Math.round(150 - bw / 2);
    // It barely rises: the camera no longer lifts for it, so it stays inside Analytics' frame.
    const by = 82 - Math.round(4 * b);
    px(bx + 4, by - 90, RAMP[3], 1, 90);
    px(bx + bw - 5, by - 90, RAMP[3], 1, 90);
    px(bx, by, RAMP[4], bw, bh);
    px(bx + 1, by + 1, RAMP[0], bw - 2, bh - 2);
    crown(146, by - 7, lit ? RAMP[8] : RAMP[7]);
    if (b > 0.85) {
      text("SETS", bx + 3, by + 3, RAMP[6]);
      text("8 WK", bx + bw - 18, by + 3, RAMP[5]);
      const peak = Math.max(1, ...s.bars);
      s.bars.forEach((v, i) => {
        const h = Math.round((v / peak) * (bh - 16));
        px(bx + 5 + i * 9, by + bh - 4 - h, i === 7 ? RAMP[8] : RAMP[6], 6, h);
      });
      px(bx + 3, by + bh - 4, RAMP[4], bw - 6, 1);
    } else if (b < 0.15) {
      let l1 = "7 DAYS";
      let l2 = `${s.week.sets} SETS`;
      const left = restLeft(now);
      if (left > 0) {
        l1 = "REST";
        l2 = restText(left);
      } else if (s.live) {
        l1 = clockText(now - s.live.startedAtMs);
        l2 = `SET ${s.live.sets + 1}`;
      } else if (now < s.savedUntil) {
        l1 = "SAVED";
        l2 = ledText(s.savedName, 9);
      }
      mid(ledText(l1, 9), 150, by + 3, RAMP[8]);
      mid(ledText(l2, 9), 150, by + 10, RAMP[6]);
      s.week.days.forEach((on, i) => px(137 + i * 4, by + bh + 2, on ? RAMP[8] : RAMP[3], 2, 2));
    }

    // coach's corner: chalkboard, stool, bottle
    px(238, 124, RAMP[4], 1, 26);
    px(270, 124, RAMP[4], 1, 26);
    px(234, 96, RAMP[at("coach") ? 6 : 4], 41, 29);
    px(235, 97, RAMP[1], 39, 27);
    crown(250, 88, at("coach") ? RAMP[8] : RAMP[6]);
    mid("ASK ME", 254.5, 103, RAMP[8]);
    mid("ANYTHING", 254.5, 111, RAMP[7]);
    px(282, 140, RAMP[5], 9, 2);
    px(283, 142, RAMP[4], 1, 8);
    px(289, 142, RAMP[4], 1, 8);
    px(278, 145, RAMP[7], 2, 5);

    // the rack (Library): plate tree, dumbbells, program board
    const hiR = at("library");
    px(324, 112, RAMP[4], 1, 38);
    px(320, 148, RAMP[4], 9, 2);
    [[118, 11], [128, 9], [137, 7]].forEach(([y, h]) => {
      px(319, y - (h >> 1), hiR ? RAMP[7] : RAMP[5], 3, h);
      px(327, y - (h >> 1), hiR ? RAMP[6] : RAMP[5], 3, h);
      px(322, y, RAMP[4], 5, 1);
    });
    for (const sy of [130, 142]) {
      px(338, sy, RAMP[4], 56, 1);
      px(339, sy, RAMP[3], 1, FLOOR - sy);
      px(392, sy, RAMP[3], 1, FLOOR - sy);
      for (let i = 0; i < 6; i += 1) {
        const x = 342 + i * 8;
        const sz = 3 + (i > 2 ? 1 : 0);
        px(x, sy - sz, hiR ? RAMP[7] : RAMP[5], 2, sz);
        px(x + 2, sy - 2, RAMP[4], 2, 1);
        px(x + 4, sy - sz, hiR ? RAMP[7] : RAMP[5], 2, sz);
      }
    }
    px(340, 90, RAMP[hiR ? 6 : 4], 45, 27);
    px(341, 91, RAMP[1], 43, 25);
    text("PROGRAMS", 347, 93, RAMP[6]);
    for (let wk = 0; wk < 6; wk += 1) for (let d = 0; d < 3; d += 1) px(344 + wk * 7, 101 + d * 5, RAMP[3], 5, 3);

    // the locker room (Profile), banners in the rafters
    const hiP = at("profile");
    for (let i = 0; i < 8; i += 1) {
      const x = 418 + i * 8;
      const mine = i === 3;
      px(x, 112, mine ? RAMP[hiP ? 7 : 5] : RAMP[4], 7, 38);
      px(x + 1, 113, mine ? RAMP[3] : RAMP[2], 5, 36);
      px(x + 2, 116, RAMP[4], 3, 1);
      px(x + 2, 118, RAMP[4], 3, 1);
      px(x + 4, 131, RAMP[6], 1, 2);
      if (mine) px(x + 2, 122, RAMP[8], 3, 3);
    }
    px(428, 144, RAMP[5], 44, 2);
    px(431, 146, RAMP[4], 1, 4);
    px(468, 146, RAMP[4], 1, 4);
    [["", s.seats >= 1], ["100", s.seats >= 100], ["1K", s.seats >= 1000]].forEach(([label, earned], i) => {
      const x = 424 + i * 24;
      const y = 62;
      px(x + 2, y - 70, RAMP[3], 1, 70);
      px(x + 11, y - 70, RAMP[3], 1, 70);
      px(x, y, earned ? RAMP[hiP ? 6 : 4] : RAMP[3], 14, 15);
      px(x + 1, y + 1, RAMP[earned ? 2 : 1], 12, 12);
      px(x + 1, y + 13, RAMP[earned ? 2 : 1], 5, 2);
      px(x + 8, y + 13, RAMP[earned ? 2 : 1], 5, 2);
      if (earned && !label) crown(x + 3, y + 4, hiP ? RAMP[8] : RAMP[7]);
      else mid(label || "1", x + 7.5, y + 5, RAMP[earned ? 8 : hiP ? 5 : 4]);
    });
  }

  /* The strip: the scoreboard on its own, flat. First match wins. */
  function stripFace(now) {
    const left = restLeft(now);
    if (left > 0) return { l1: "REST", l2: restText(left), bar: left / s.rest.durationMs };
    if (s.live) return { l1: clockText(now - s.live.startedAtMs), l2: `SET ${s.live.sets + 1}` };
    if (now < s.savedUntil) return { l1: "SAVED", l2: ledText(s.savedName, 9) };
    if (s.facet === "coach") return { l1: "ASK ME", l2: "ANYTHING" };
    if (s.facet === "home") {
      const faces = [
        ["7 DAYS", `${s.week.sets} SETS`],
        ["WORKOUTS", String(s.week.workouts || 0)],
      ];
      const [l1, l2] = faces[prefersReducedMotion() ? 0 : Math.floor(now / FACE_MS) % faces.length];
      return { l1, l2, lamps: true };
    }
    if (s.facet === "analytics") return { l1: "8 WEEKS", l2: `${s.bars.reduce((a, b) => a + b, 0)} SETS` };
    if (s.facet === "history") return { l1: "HISTORY", l2: `${s.seats} WORKOUTS` };
    return { l1: "LOGCHAMP", l2: "" };
  }

  /* Redrawn only when what it shows changes (a clock ticks once a second). */
  function drawStrip(now) {
    if (!stripG) return;
    const face = stripFace(now);
    const hot = now < s.flashUntil;
    const l1 = ledText(face.l1, 9);
    const l2 = ledText(face.l2, 9);
    const barW = face.bar == null ? -1 : Math.round(W * face.bar);
    const sig = [l1, l2, face.lamps ? s.week.days.join("") : "", barW, hot, W, SH].join("|");
    if (sig === stripSig) return;
    stripSig = sig;
    const keep = [g, cx, cy];
    g = stripG;
    cx = 0;
    cy = 0;
    const m = W / 2;
    const big = l1.length <= 8;
    const h1 = big ? 10 : 5;
    const gap = l2 ? 3 : 0;
    const block = h1 + gap + (l2 ? 5 : 0) + (face.lamps ? 4 : 0);
    let y = Math.max(1, Math.floor((SH - 1 - block) / 2));
    px(0, 0, RAMP[0], W, SH);
    px(0, SH - 1, RAMP[hot ? 8 : 4], W, 1);
    crown(4, Math.round(SH / 2) - 3, RAMP[hot ? 8 : 7]);
    mid(l1, m, y, RAMP[8], big ? 2 : 1);
    y += h1 + gap;
    if (l2) mid(l2, m, y, RAMP[6]);
    y += l2 ? 5 : 0;
    if (face.lamps) s.week.days.forEach((on, i) => px(Math.round(m) - 13 + i * 4, y + 2, on ? RAMP[8] : RAMP[3], 2, 2));
    if (barW >= 0) px(0, SH - 2, RAMP[7], barW, 1);
    [g, cx, cy] = keep;
  }

  function frame(t) {
    raf = 0;
    if (dead) return;
    const now = Date.now();
    const tNow = typeof t === "number" ? t : performance.now();
    const dt = lastT ? Math.min(64, tNow - lastT) : 16;
    lastT = tNow;
    const reduced = prefersReducedMotion();

    // The camera only walks sideways: a time-based tween, one frame per animation frame.
    const tx = targetX();
    if (reduced || !cam.ready || s.covered) {
      cam.x = tx;
      walk.to = tx;
      walk.dur = 0;
    } else if (tx !== walk.to) {
      walk.from = cam.x;
      walk.to = tx;
      walk.t0 = tNow;
      walk.dur = Math.min(900, 380 + Math.abs(tx - cam.x) * 1.2);
    }
    if (walk.dur) {
      const p = Math.min(1, (tNow - walk.t0) / walk.dur);
      cam.x = walk.from + (walk.to - walk.from) * inOut(p);
      if (p >= 1) walk.dur = 0;
    }

    const k = reduced || !cam.ready ? 1 : 1 - Math.exp(-dt / 80);
    const left = restLeft(now);
    const rest = left > 0 && s.rest ? 1 - left / s.rest.durationMs : 1;
    const wantPower = s.live ? 0.3 + 0.7 * rest : now < s.savedUntil ? 0.9 : 0.5;
    const wantBoard = s.place === "analytics" ? 1 : 0;
    ease.power += (wantPower - ease.power) * k;
    ease.board += (wantBoard - ease.board) * k;
    cam.ready = true;
    const easing = Math.abs(wantPower - ease.power) > 0.01 || Math.abs(wantBoard - ease.board) > 0.01;
    if (!easing) {
      ease.power = wantPower;
      ease.board = wantBoard;
    }
    if (!document.hidden && !s.covered) draw(now);
    if (!document.hidden && s.strip) drawStrip(now);
    const flashing = now < s.flashUntil && !reduced;
    if (walk.dur || easing || flashing) raf = window.requestAnimationFrame(frame);
    else lastT = 0;
  }

  function kick() {
    if (!raf && !dead) raf = window.requestAnimationFrame(frame);
  }

  /* The clock, the rest countdown and the SAVED face change once a second;
     Home's strip turns its face every FACE_MS while it is showing. */
  function syncClock() {
    const now = Date.now();
    const need = Boolean(s.live) || now < s.savedUntil;
    if (need && !clock) {
      clock = window.setInterval(() => {
        if (!s.live && Date.now() >= s.savedUntil) syncClock();
        kick();
      }, 1000);
    } else if (!need && clock) {
      window.clearInterval(clock);
      clock = 0;
    }
    const turn = s.strip && !need && s.facet === "home" && !prefersReducedMotion();
    if (turn && !cycle) {
      cycle = window.setTimeout(() => {
        cycle = 0;
        kick();
        syncClock();
      }, FACE_MS - (now % FACE_MS) + 20);
    } else if (!turn && cycle) {
      window.clearTimeout(cycle);
      cycle = 0;
    }
  }

  return {
    set(patch) {
      Object.assign(s, patch);
      syncClock();
      kick();
    },
    flash(ms) {
      s.flashUntil = Date.now() + ms;
      kick();
      // Reduced motion runs no flash frames: one more draw puts the edge back.
      window.setTimeout(kick, ms + 20);
    },
    resize() {
      const cssW = canvas.clientWidth || 400;
      const cssH = canvas.clientHeight || 600;
      // Phone: 4 css px per pixel. Wide screens: about 190 rows for the full view, so the open sizes keep the board in view.
      const scale = cssW < 720 ? 4 : Math.max(2, Math.round(cssH / 190));
      W = Math.max(40, Math.round(cssW / scale));
      H = Math.max(24, Math.round(cssH / scale));
      canvas.width = W;
      canvas.height = H;
      // Fixed for this frame size: the floor sits just above the stage's bottom edge.
      cam.y = FLOOR + FLOOR_MARGIN - H;
      cam.ready = false;
      if (strip) {
        SH = Math.max(12, Math.round((strip.clientHeight || 120) / scale));
        strip.width = W;
        strip.height = SH;
        stripSig = "";
      }
      kick();
    },
    recolor() {
      RAMP = readRamp();
      stripSig = "";
      kick();
    },
    destroy() {
      dead = true;
      window.cancelAnimationFrame(raf);
      window.clearInterval(clock);
      window.clearTimeout(cycle);
    },
  };
}
