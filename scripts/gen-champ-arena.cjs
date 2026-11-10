// Renders the Champ Arena scene stills (champ.png = lights low, champ-live.png =
// lights up) for client/src/assets/scenes/. Deterministic (seeded). Needs
// Playwright; run: node scripts/gen-champ-arena.cjs client/src/assets/scenes
// The floor below the platform is deliberate: the phone bottom nav covers it.
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const urls = await p.evaluate(() => {
    const W = 176, H = 88, K = 4;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const RAMP = ["#05071a", "#080c26", "#0d1236", "#141b4d", "#1e2870", "#2f3c9c", "#4f5fd0", "#8b9bff", "#dfe4ff"];
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
    const CROWN = ["....#....", "#...#...#", "##.###.##", "#########", "#########", ".#######."];
    const FLOOR = 62, TOWERS = [{ x: 54, y: 20 }, { x: 122, y: 20 }], TARGET = { x: 88, y: 60 };
    const seats = [];
    for (let side = 0; side < 2; side++) for (let tier = 0; tier < 12; tier++) {
      const y = FLOOR - 3 - tier * 4, reach = 70 - tier * 2.4;
      for (let i = 1; i < reach; i += 2) seats.push({ x: side ? W - 1 - i : i, y, lit: rnd() < 0.3 });
    }
    function render(power) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
      const px = (x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      const field = (x, y) => {
        let v = 0.05 + 0.2 * Math.pow(Math.min(1, y / FLOOR), 2) - (y > FLOOR ? 0.012 * (y - FLOOR) : 0);
        for (const t of TOWERS) {
          const ax = TARGET.x - t.x, ay = TARGET.y - t.y, len = Math.hypot(ax, ay), qx = x - t.x, qy = y - t.y, d = Math.hypot(qx, qy);
          if (d < 1) continue;
          const ang = Math.acos(Math.max(-1, Math.min(1, (qx * ax + qy * ay) / (d * len))));
          if (ang < 0.44 && d < len * 1.25) v += power * 0.72 * Math.pow(1 - ang / 0.44, 1.3) * (1 - 0.35 * (d / len));
          v += power * 0.5 * Math.max(0, 1 - d / 9);
        }
        const ex = (x - TARGET.x) / 30, ey = (y - (FLOOR + 3)) / 7;
        return v + Math.max(0, 1 - (ex * ex + ey * ey)) * 0.8 * power;
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = Math.min(0.999, field(x, y)) * (RAMP.length - 2), lo = Math.floor(v);
        px(x, y, RAMP[v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? lo + 1 : lo]);
      }
      for (let side = 0; side < 2; side++) for (let tier = 0; tier < 12; tier++) {
        const y = FLOOR - 4 - tier * 4, reach = Math.round(70 - tier * 2.4);
        px(side ? W - reach : 0, y, RAMP[1], reach, 4); px(side ? W - reach : 0, y, RAMP[3], reach, 1);
      }
      for (const s of seats) px(s.x, s.y + 1, s.lit ? (power > 0.9 ? RAMP[6] : RAMP[5]) : RAMP[2]);
      px(0, FLOOR, RAMP[4], W, 1);
      px(70, FLOOR - 2, RAMP[5], 36, 2); px(72, FLOOR, RAMP[3], 32, 2);
      const lit = power > 0.9;
      px(74, FLOOR - 6, lit ? RAMP[8] : RAMP[6], 28, 1);
      for (const sx of [74, 99]) { px(sx, FLOOR - 10, lit ? RAMP[7] : RAMP[5], 3, 9); px(sx === 74 ? 77 : 97, FLOOR - 9, RAMP[5], 2, 7); }
      for (const t of TOWERS) {
        px(t.x, t.y + 2, RAMP[4], 1, FLOOR - t.y - 2); px(t.x - 3, t.y - 2, RAMP[2], 7, 4);
        for (let k = 0; k < 3; k++) px(t.x - 2 + k * 2, t.y - 1, lit || k === 1 ? RAMP[8] : RAMP[5], 1, 2);
      }
      const bx = 81, by = 26;
      px(bx + 2, 0, RAMP[3], 1, by); px(bx + 11, 0, RAMP[3], 1, by);
      px(bx, by, RAMP[4], 14, 13); px(bx + 1, by + 1, RAMP[2], 12, 10); px(bx + 1, by + 11, RAMP[2], 5, 2); px(bx + 8, by + 11, RAMP[2], 5, 2);
      CROWN.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '#') px(bx + 3 + rx, by + 3 + ry, lit ? RAMP[8] : RAMP[7]); }));
      const big = document.createElement('canvas'); big.width = W * K; big.height = H * K; const bg = big.getContext('2d');
      bg.imageSmoothingEnabled = false; bg.drawImage(cv, 0, 0, W * K, H * K);
      return big.toDataURL('image/png');
    }
    return { champ: render(0.5), 'champ-live': render(1) };
  });
  for (const [k, u] of Object.entries(urls)) fs.writeFileSync(`${out}/${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
  await b.close();
})();
