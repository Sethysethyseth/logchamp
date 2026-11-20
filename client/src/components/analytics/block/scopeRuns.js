/**
 * Chip list for Analytics block scope: active run(s) first, then the three
 * most recent ended runs. Input order from the API is newest-started first.
 */

export function pickScopeRuns(runs) {
  const list = Array.isArray(runs) ? runs : [];
  const active = list.filter((r) => r && r.active);
  const ended = list
    .filter((r) => r && !r.active)
    .slice()
    .sort((a, b) => {
      const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 3);
  return [...active, ...ended];
}
