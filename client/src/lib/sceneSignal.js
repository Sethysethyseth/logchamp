/* The scene layer reacts to training through two attributes on <html>
 * (index.css, "Champ Arena" section): `data-scene-live` while a workout is
 * in progress (the arena's towers switch on), and `data-scene-cheer` for a
 * moment after something lands - "finish" (camera flashes) or "rest" (one
 * blink when the rest timer runs out). Decorative only; palettes without a
 * lit layer ignore both.
 */

let cheerTimer = 0;

export function setSceneLive(on) {
  if (typeof document === "undefined") return;
  document.documentElement.toggleAttribute("data-scene-live", Boolean(on));
}

export function sceneCheer(kind = "finish") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  window.clearTimeout(cheerTimer);
  root.removeAttribute("data-scene-cheer");
  // Next frame, so a repeat cheer restarts its animation.
  window.requestAnimationFrame(() => {
    root.setAttribute("data-scene-cheer", kind);
    cheerTimer = window.setTimeout(
      () => root.removeAttribute("data-scene-cheer"),
      kind === "rest" ? 700 : 2400
    );
  });
}
