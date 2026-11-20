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
