/**
 * Screen section registries. Ids are a stored contract (Customize saves
 * them per device) - never rename one; retire it and add a new id.
 * Order here is the default order.
 */
export const HOME_SECTIONS = [
  { id: "start", label: "Start a workout", defaultOn: true, locked: true },
  { id: "upnext", label: "Next in your block", defaultOn: true, locked: false },
  { id: "week", label: "This week", defaultOn: true, locked: false },
  { id: "beat", label: "Beat last time", defaultOn: true, locked: false },
  { id: "due", label: "Due", defaultOn: false, locked: false },
  { id: "highlights", label: "Highlights", defaultOn: true, locked: false },
  { id: "recent", label: "Recent workouts", defaultOn: true, locked: false },
];

/** Top-of-page Analytics sections (above the view tabs). */
export const ANALYTICS_TOP_SECTIONS = [
  { id: "tiles", label: "Headline numbers", defaultOn: true, locked: false },
  { id: "coach", label: "Ask the coach", defaultOn: true, locked: false },
];

/**
 * Per-view Analytics cards. `quality` is ONE switch for every view it
 * appears in (shared: true) - toggling it updates every list.
 */
export const ANALYTICS_VIEW_SECTIONS = {
  muscles: [
    { id: "volume", label: "Weekly volume by muscle", defaultOn: true },
    { id: "balance", label: "Balance", defaultOn: true },
    { id: "quality", label: "Data quality", defaultOn: true, shared: true },
  ],
  strength: [
    { id: "trends", label: "Strength trends", defaultOn: true },
    { id: "quality", label: "Data quality", defaultOn: true, shared: true },
  ],
  exercises: [{ id: "explorer", label: "Exercise explorer", defaultOn: true }],
  execution: [
    { id: "execution", label: "Execution", defaultOn: true },
    { id: "quality", label: "Data quality", defaultOn: true, shared: true },
  ],
};

export const ANALYTICS_VIEW_KEYS = ["muscles", "strength", "exercises", "execution"];

export const ANALYTICS_VIEW_LABELS = {
  muscles: "Muscles",
  strength: "Strength",
  exercises: "Exercises",
  execution: "Execution",
};

/**
 * Ordered `[{ id, on }]` from a registry and a saved layout (or null).
 * Saved order wins; unknown and repeated saved ids are dropped; registry
 * ids the saved layout lacks are appended in registry order with their
 * defaults; locked ids are always on.
 *
 * @param {{ id: string, defaultOn: boolean, locked?: boolean }[]} registry
 * @param {{ id: string, on?: boolean }[] | null | undefined} saved
 * @returns {{ id: string, on: boolean }[]}
 */
export function resolveLayout(registry, saved) {
  const byId = new Map(registry.map((entry) => [entry.id, entry]));
  const out = [];
  const placed = new Set();

  for (const row of Array.isArray(saved) ? saved : []) {
    const entry = row && byId.get(row.id);
    if (!entry || placed.has(entry.id)) continue;
    placed.add(entry.id);
    out.push({ id: entry.id, on: entry.locked ? true : row.on !== false });
  }

  for (const entry of registry) {
    if (placed.has(entry.id)) continue;
    out.push({ id: entry.id, on: entry.locked ? true : Boolean(entry.defaultOn) });
  }

  return out;
}

/** Default analytics layout from the registries. */
export function defaultAnalyticsLayout() {
  const views = {};
  for (const key of ANALYTICS_VIEW_KEYS) {
    views[key] = resolveLayout(ANALYTICS_VIEW_SECTIONS[key], null);
  }
  return {
    top: resolveLayout(ANALYTICS_TOP_SECTIONS, null),
    views,
  };
}

/**
 * Merge a saved analytics blob with the registries. Shared `quality` on
 * state: the first saved quality wins; every view that carries quality
 * gets that same on value.
 *
 * @param {{ top?: unknown, views?: Record<string, unknown> } | null | undefined} saved
 */
export function resolveAnalyticsLayout(saved) {
  const top = resolveLayout(ANALYTICS_TOP_SECTIONS, saved?.top);
  const views = {};
  let qualityOn = null;
  for (const key of ANALYTICS_VIEW_KEYS) {
    const registry = ANALYTICS_VIEW_SECTIONS[key];
    const resolved = resolveLayout(registry, saved?.views?.[key]);
    const q = resolved.find((r) => r.id === "quality");
    if (q && qualityOn === null && Array.isArray(saved?.views?.[key])) {
      const savedQ = saved.views[key].find((r) => r && r.id === "quality");
      if (savedQ) qualityOn = savedQ.on !== false;
    }
    views[key] = resolved;
  }
  if (qualityOn === null) {
    const defQ = ANALYTICS_VIEW_SECTIONS.muscles.find((e) => e.id === "quality");
    qualityOn = Boolean(defQ?.defaultOn);
  }
  for (const key of ANALYTICS_VIEW_KEYS) {
    views[key] = views[key].map((row) =>
      row.id === "quality" ? { ...row, on: qualityOn } : row
    );
  }
  return { top, views };
}

/**
 * Views that still have at least one on section. A view with every
 * section hidden drops its tab.
 *
 * @param {{ views: Record<string, { id: string, on: boolean }[]> }} analytics
 * @returns {string[]}
 */
export function visibleAnalyticsViews(analytics) {
  return ANALYTICS_VIEW_KEYS.filter((key) => {
    const rows = analytics?.views?.[key];
    return Array.isArray(rows) && rows.some((r) => r.on);
  });
}

/**
 * Pick the open view: keep `current` if still visible, else the first
 * remaining view (or muscles if somehow none remain).
 */
export function resolveOpenAnalyticsView(analytics, current) {
  const live = visibleAnalyticsViews(analytics);
  if (live.includes(current)) return current;
  return live[0] || "muscles";
}

/**
 * Toggle a section on/off. For shared `quality`, every view list updates.
 *
 * @param {{ top: {id:string,on:boolean}[], views: Record<string,{id:string,on:boolean}[]> }} analytics
 * @param {"top"|string} listKey - "top" or a view key
 * @param {string} id
 * @param {boolean} on
 */
export function setAnalyticsSectionOn(analytics, listKey, id, on) {
  const next = {
    top: analytics.top.map((r) => ({ ...r })),
    views: Object.fromEntries(
      Object.entries(analytics.views).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))])
    ),
  };
  if (id === "quality") {
    for (const key of ANALYTICS_VIEW_KEYS) {
      next.views[key] = next.views[key].map((r) => (r.id === "quality" ? { ...r, on } : r));
    }
    return next;
  }
  if (listKey === "top") {
    next.top = next.top.map((r) => (r.id === id ? { ...r, on } : r));
  } else if (next.views[listKey]) {
    next.views[listKey] = next.views[listKey].map((r) => (r.id === id ? { ...r, on } : r));
  }
  return next;
}

/**
 * Reorder one analytics list.
 * @param {{ top: {id:string,on:boolean}[], views: Record<string,{id:string,on:boolean}[]> }} analytics
 * @param {"top"|string} listKey
 * @param {string[]} orderIds
 */
export function reorderAnalyticsList(analytics, listKey, orderIds) {
  const next = {
    top: analytics.top.map((r) => ({ ...r })),
    views: Object.fromEntries(
      Object.entries(analytics.views).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))])
    ),
  };
  const apply = (rows) => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const out = [];
    for (const id of orderIds) {
      const row = byId.get(id);
      if (row) out.push(row);
    }
    for (const row of rows) {
      if (!out.some((r) => r.id === row.id)) out.push(row);
    }
    return out;
  };
  if (listKey === "top") next.top = apply(next.top);
  else if (next.views[listKey]) next.views[listKey] = apply(next.views[listKey]);
  return next;
}
