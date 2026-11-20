process.env.SMOKE_SHOTS = (process.argv[2] || __dirname) + "/cap";
const fs = require("fs");
const { open } = require("/home/user/logchamp/scripts/smoke-rig.cjs");
(async () => {
  const r = await open({ arena: true, theme: "dark", palette: "champ" });
  const P = r.page;
  const save = (n, s) => fs.writeFileSync(`${(process.argv[2] || __dirname)}/cap/${n}`, s);
  await P.goto(r.url("/profile/appearance")); await P.waitForTimeout(4000);
  await r.shot("appearance"); await P.evaluate(() => scrollTo(0, 600)); await P.waitForTimeout(600); await r.shot("appearance-2");
  save("appearance.html", await P.evaluate(() => document.querySelector("main")?.outerHTML || ""));
  save("htmlattrs.json", await P.evaluate(() => JSON.stringify([...document.documentElement.attributes].map(a => [a.name, a.value]))));
  save("app.css", await P.evaluate(() => [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch (e) { return "/* " + s.href + " */"; } }).join("\n")));
  await P.goto(r.url("/")); await P.waitForTimeout(5000);
  await P.evaluate(() => scrollTo(0, 10000)); await P.waitForTimeout(1500); await P.evaluate(() => scrollTo(0, 0)); await P.waitForTimeout(800);
  save("home.html", await P.evaluate(() => document.querySelector("main")?.outerHTML || ""));
  save("nav.html", await P.evaluate(() => (document.querySelector("nav.bottom-nav, .bottom-nav, nav[aria-label]")||{}).outerHTML || ""));
  save("body.html", await P.evaluate(() => document.querySelector("#root").outerHTML.slice(0, 200000)));
  await P.goto(r.url("/analytics")); await P.waitForTimeout(5000);
  const views = ["muscles", "strength", "exercises", "execution"];
  for (const v of views) {
    await P.goto(r.url("/analytics?view=" + v)); await P.waitForTimeout(3500);
    await P.evaluate(() => scrollTo(0, 10000)); await P.waitForTimeout(2500); await P.evaluate(() => scrollTo(0, 0)); await P.waitForTimeout(600);
    save(`analytics-${v}.html`, await P.evaluate(() => document.querySelector("main")?.outerHTML || ""));
  }
  console.log("errors", r.errors.slice(0, 3));
  await r.browser.close();
})();
