import { useSyncExternalStore } from "react";

/* Arena view (beta): a per-device switch, like the theme. Off by default.
 * (Storage key keeps the workoutdb- prefix - see the rename boundary.) */

const KEY = "workoutdb-arena";
const EVENT = "workoutdb-arena-change";

export function readArenaView() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setArenaView(on) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the switch just does not stick */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useArenaView() {
  return useSyncExternalStore(subscribe, readArenaView, () => false);
}
