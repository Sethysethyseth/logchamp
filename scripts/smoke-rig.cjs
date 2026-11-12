// Phone-profile driver for the cloud smoke rig (scripts/cloud-smoke-up.sh).
// Not imported by the app. Playwright is the cloud container's preinstalled
// copy - it is NOT a repo dependency and must not become one.
//
//   const { open, sheet } = require("/home/user/logchamp/scripts/smoke-rig.cjs");
//   const r = await open({ arena: true, theme: "dark", palette: "champ", reduced: false });
//   await r.page.goto(r.url("/"));          // logged in as the smoke account
//   await r.shot("01-home");                 // -> <SMOKE_SHOTS>/01-home.png
//   await r.geom();                          // scroll width, stage/sheet edges, strip opacity
//   await r.rafIdle(2000);                   // rAF callbacks in 2 s (0 = at rest)
//   await r.touch("touchStart", [[x, y]]);   // raw touches: holds, drags, pinches
//   await sheet("overview.png", ["01-home", "02-..."]); // one contact sheet, cheap to look at
//
// Look at contact sheets, not single screenshots: four phone frames in one
// image is the difference between a quick smoke and a slow one.
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const SHOTS = process.env.SMOKE_SHOTS || "/tmp/logchamp-smoke/shots";
const CLIENT = process.env.SMOKE_CLIENT || "http://localhost:5173";
const API = process.env.SMOKE_API || "http://localhost:3000";

async function open({ arena = false, reduced = false, theme, palette, device = "Pixel 7" } = {}) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...devices[device],
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const res = await ctx.request.post(API + "/auth/login", {
    data: { login: "smoke-b8@example.com", password: "SmokeTest-B8-2026" },
  });
  const { token } = await res.json();
  await ctx.addInitScript(
    ([token, arena, theme, palette]) => {
      localStorage.setItem("authToken", token);
      if (arena) localStorage.setItem("workoutdb-arena", "1");
      if (theme) localStorage.setItem("workoutdb-theme", theme);
      if (palette) localStorage.setItem("workoutdb-palette", palette);
      window.__raf = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => { window.__raf++; cb(t); });
    },
    [token, arena, theme, palette]
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  const cdp = await ctx.newCDPSession(page);
  return {
    browser, ctx, page, errors,
    url: (p) => CLIENT + p,
    shot: (name) => page.screenshot({ path: path.join(SHOTS, name + ".png") }),
    touch: (type, pts) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) }),
    rafIdle: async (ms = 2000) => {
      const a = await page.evaluate(() => window.__raf);
      await page.waitForTimeout(ms);
      return (await page.evaluate(() => window.__raf)) - a;
    },
    geom: () =>
      page.evaluate(() => {
        const r1 = (n) => (n == null ? n : Math.round(n * 10) / 10);
        const st = document.querySelector(".arena-stage")?.getBoundingClientRect();
        const sh = document.querySelector(".arena-sheet")?.getBoundingClientRect();
        const strip = document.querySelector(".arena-strip");
        return {
          scrollY, scrollWidth: document.documentElement.scrollWidth, innerWidth,
          stageBottom: r1(st?.bottom), sheetTop: r1(sh?.top),
          gap: st && sh ? r1(sh.top - st.bottom) : null,
          stripOpacity: strip ? getComputedStyle(strip).opacity : null,
        };
      }),
  };
}

async function sheet(out, names) {
  const html = path.join(SHOTS, "_sheet.html");
  fs.writeFileSync(
    html,
    '<body style="margin:0;background:#333;display:flex;gap:8px;padding:5px;font:12px sans-serif;color:#fff">' +
      names.map((n) => `<div><div>${n}</div><img src="${n}.png" style="width:412px;display:block"></div>`).join("") +
      "</body>"
  );
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: names.length * 420 + 10, height: 950 } });
  await page.goto("file://" + html);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, out) });
  await browser.close();
}

module.exports = { open, sheet, SHOTS };
