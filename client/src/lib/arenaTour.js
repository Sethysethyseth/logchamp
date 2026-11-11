import { useSyncExternalStore } from "react";

/* Arena view: the full view. In memory only - a reload always lands on the
 * page. Changing tab keeps it; only tapping the arena or the line ends it. */

const EVENT = "workoutdb-arena-tour-change";

let on = false;

export function readArenaTour() {
  return on;
}

export function setArenaTour(next) {
  const value = Boolean(next);
  if (value === on) return;
  on = value;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
  };
}

export function useArenaTour() {
  return useSyncExternalStore(subscribe, readArenaTour, () => false);
}
