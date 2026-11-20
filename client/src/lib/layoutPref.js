import { useSyncExternalStore } from "react";
import {
  HOME_SECTIONS,
  defaultAnalyticsLayout,
  resolveAnalyticsLayout,
  resolveLayout,
} from "./screenLayout.js";

/* Home + Analytics section layout: per-device, like arena/theme.
 * Key keeps the workoutdb- prefix (rename boundary). */

const KEY = "workoutdb-layout";
const EVENT = "workoutdb-layout-change";

/** @typedef {{ id: string, on: boolean }} LayoutRow */
/** @typedef {{
 *   v: 1,
 *   home: LayoutRow[],
 *   analytics: {
 *     top: LayoutRow[],
 *     views: Record<string, LayoutRow[]>
 *   }
 * }} StoredLayout */

/** @returns {StoredLayout} */
export function defaultStoredLayout() {
  return {
    v: 1,
    home: resolveLayout(HOME_SECTIONS, null),
    analytics: defaultAnalyticsLayout(),
  };
}

/** Stable server/SSR snapshot - useSyncExternalStore requires a cached getSnapshot. */
const SERVER_SNAPSHOT = defaultStoredLayout();

let cachedRaw = undefined;
/** @type {StoredLayout} */
let cachedLayout = SERVER_SNAPSHOT;

/**
 * @param {unknown} raw
 * @returns {StoredLayout}
 */
export function normalizeStoredLayout(raw) {
  const base = defaultStoredLayout();
  if (!raw || typeof raw !== "object") return base;
  const home = resolveLayout(HOME_SECTIONS, Array.isArray(raw.home) ? raw.home : null);
  const analytics = resolveAnalyticsLayout(raw.analytics);
  return { v: 1, home, analytics };
}

function refreshCache() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw && cachedRaw !== undefined) return cachedLayout;
    cachedRaw = raw;
    cachedLayout = raw ? normalizeStoredLayout(JSON.parse(raw)) : defaultStoredLayout();
    return cachedLayout;
  } catch {
    cachedRaw = null;
    cachedLayout = defaultStoredLayout();
    return cachedLayout;
  }
}

/** @returns {StoredLayout} */
export function readLayout() {
  return refreshCache();
}

/** @param {StoredLayout} next */
export function writeLayout(next) {
  const normalized = normalizeStoredLayout(next);
  try {
    const raw = JSON.stringify(normalized);
    localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cachedLayout = normalized;
  } catch {
    /* private mode: keep in-memory so this session still reacts */
    cachedRaw = undefined;
    cachedLayout = normalized;
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Reset Home or Analytics (or both) to registry defaults. */
export function resetLayoutScreen(screen) {
  const cur = readLayout();
  const base = defaultStoredLayout();
  if (screen === "home") writeLayout({ ...cur, home: base.home });
  else if (screen === "analytics") writeLayout({ ...cur, analytics: base.analytics });
  else writeLayout(base);
}

/**
 * Patch Home rows (order + on). Unknown ids ignored by resolveLayout.
 * @param {LayoutRow[]} home
 */
export function setHomeLayout(home) {
  const cur = readLayout();
  writeLayout({ ...cur, home: resolveLayout(HOME_SECTIONS, home) });
}

/**
 * Patch analytics layout; quality on-state stays shared across views.
 * @param {StoredLayout["analytics"]} analytics
 */
export function setAnalyticsLayout(analytics) {
  const cur = readLayout();
  writeLayout({ ...cur, analytics: resolveAnalyticsLayout(analytics) });
}

function subscribe(onChange) {
  const onStorage = () => {
    cachedRaw = undefined;
    onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live stored layout (device-local). */
export function useLayout() {
  return useSyncExternalStore(subscribe, readLayout, () => SERVER_SNAPSHOT);
}
