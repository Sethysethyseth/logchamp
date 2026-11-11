/* The scene layer reacts to training through two attributes on <html>
 * (index.css, "Champ Arena" section): `data-scene-live` while a workout is
 * in progress (the arena's towers switch on), and `data-scene-cheer` for a
 * moment after something lands - "finish" (camera flashes) or "rest" (one
 * blink when the rest timer runs out). Decorative only; palettes without a
 * lit layer ignore both.
 */

let cheerTimer = 0;

/**
 * Arena view (beta) listens for these: "finish", "rest", "set", and the
 * easter eggs it carries into the room - "rain" (five taps on the Home
 * crown), "lift" / "drop" (a Start button on Home held, then let go).
 * Senders never import the arena; with it off nobody is listening.
 */
export const SCENE_SIGNAL_EVENT = "workoutdb-scene-signal";

export function sceneSignal(kind) {
  try {
    window.dispatchEvent(new CustomEvent(SCENE_SIGNAL_EVENT, { detail: { kind } }));
  } catch {
    /* no window */
  }
}

export function setSceneLive(on) {
  if (typeof document === "undefined") return;
  document.documentElement.toggleAttribute("data-scene-live", Boolean(on));
}

export function sceneCheer(kind = "finish") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  sceneSignal(kind);
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
