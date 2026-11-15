import { useSyncExternalStore } from "react";

/* Arena view: a per-device switch, like the theme. On by default.
 * Stored values: "1" = Arena, "0" = Classic, absent/anything else = Arena.
 * (Storage key keeps the workoutdb- prefix - see the rename boundary.) */

const KEY = "workoutdb-arena";
const EVENT = "workoutdb-arena-change";

export function readArenaView() {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setArenaView(on) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.setItem(KEY, "0");
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
  return useSyncExternalStore(subscribe, readArenaView, () => true);
}
