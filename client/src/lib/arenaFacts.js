import { useSyncExternalStore } from "react";

/* Arena view: what pages already fetched, for the boards to read. In memory
 * only. Keys: analytics { weeks, summary }, week { summary },
 * block { name, progress } | null. A key never published reads undefined. */

let facts = {};
const listeners = new Set();

/* Same reference, or plain objects whose own values are the same references. */
function same(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && Object.is(a[k], b[k]));
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function readArenaFacts() {
  return facts;
}

/** Shallow merge; subscribers hear only about a value that actually changed. */
export function publishArenaFacts(patch) {
  if (!patch) return;
  let next = null;
  for (const [key, value] of Object.entries(patch)) {
    if (same(facts[key], value)) continue;
    next = next || { ...facts };
    next[key] = value;
  }
  if (!next) return;
  facts = next;
  notify();
}

/** Forget everything (a new stage may belong to another account). */
export function resetArenaFacts() {
  if (Object.keys(facts).length === 0) return;
  facts = {};
  notify();
}

function subscribe(onChange) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useArenaFacts() {
  return useSyncExternalStore(subscribe, readArenaFacts, readArenaFacts);
}
