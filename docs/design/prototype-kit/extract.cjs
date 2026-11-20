// Slice the captured pages into module markup: node extract.cjs <kit_dir>
// Reads <kit_dir>/cap/*.html, writes <kit_dir>/modules.json { home, analytics, nav }.
const { chromium } = require("playwright"); const fs = require("fs");
const dir = process.argv[2] || __dirname;
const read = (n) => fs.readFileSync(`${dir}/cap/${n}`, "utf8");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(read("home.html"));
  const home = await p.evaluate(() => {
    const q = (s) => document.querySelector(s); const wr = q(".weekly-report");
    return { masthead: q(".home-masthead").outerHTML, start: q(".workout-tab__log-row").outerHTML,
      weekStrip: wr.querySelector(".weekly-report__strip").outerHTML, stat0: wr.querySelectorAll(".weekly-report__stat")[0].outerHTML,
      digest: wr.querySelector(".weekly-report__digest").outerHTML, recent: q(".workout-tab-recent").outerHTML };
  });
  const analytics = {};
  for (const v of ["muscles", "strength", "exercises", "execution"]) {
    await p.setContent(read(`analytics-${v}.html`));
    analytics[v] = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return { head: q(".analytics-page > div:first-child").outerHTML, range: q(".analytics-range-chips").outerHTML,
        tiles: q(".analytics-kpis").outerHTML, coach: q(".coach-launch-wrap")?.outerHTML || "", tabs: q(".analytics-view-tabs").outerHTML,
        cards: [...q(".analytics-view").children].map((c) => ({ title: (c.querySelector("h2,h3")?.textContent || c.className).trim().replace(/\s+/g, " ").slice(0, 60), html: c.outerHTML })) };
    });
  }
  const body = read("body.html"); const i = body.indexOf('<nav class="bottom-nav"');
  const nav = body.slice(i, body.indexOf("</nav>", i) + 6);
  fs.writeFileSync(`${dir}/modules.json`, JSON.stringify({ home, analytics, nav }));
  await b.close();
})();
