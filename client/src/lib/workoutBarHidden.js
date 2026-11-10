/* Which workout's resume bar has been swiped away (MXF11 / MXF12). One tiny
 * store so the bar, the Home-tab pip and the "resume brings it back" rule
 * agree. sessionStorage ends with the tab / app; a storage throw just means
 * the in-memory value is all there is.
 */
const KEY = "workoutdb-workout-bar-hidden";
const listeners = new Set();

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? String(raw) : null;
  } catch {
    return null;
  }
}

let hiddenId = typeof window === "undefined" ? null : read();

export function getHiddenWorkoutBarId() {
  return hiddenId;
}

export function setHiddenWorkoutBarId(id) {
  const next = id == null ? null : String(id);
  if (next === hiddenId) return;
  hiddenId = next;
  try {
    if (next == null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, next);
  } catch {
    /* ignore - memory still holds it for this page */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeHiddenWorkoutBar(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
