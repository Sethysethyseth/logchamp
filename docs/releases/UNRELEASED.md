# UNRELEASED - What's New ledger (single writer: Claude Code)

Shipped work waiting for release notes. The What's New lane
(`docs/tasks/_WHATS_NEW.md`) turns this into `RELEASES` entries at wave end.
Then Claude Code moves the consumed sections VERBATIM to
`docs/releases/RELEASED.md` (newest first) and resets this file to its
header. Process of record: `docs/specs/quality-of-life-wave.md` section 4.

Entry format, one per user-facing landing (`land-unit` section 5 appends
it):

`- [<unit>] <what changed, plain words> | Where: <tap path> | Files: <1-3 key UI files the writer should read>`

Write what a lifter would notice. Internal-only work gets no entry.

---

## Block Lens wave (BL)

- [bl1] The arena now walks in the same order as your tabs - Home, Analytics, History, Library, Profile - and Analytics has its own scoreboard in the room. The coach's chalkboard corner is gone; the coach now talks on the Home scoreboard. | Where: swipe between tabs with Arena on | Files: client/src/components/arena/arenaEngine.js, client/src/components/arena/ArenaStage.jsx
- [bl2] Home is now a set of cards - start your workout, what is up next, this week at a glance, and a new Beat last time card that shows your last top set on your next lifts and the one-more-rep target. Top set and Top gain moved off Home (they are still on Analytics). | Where: Home | Files: client/src/pages/DashboardPage.jsx, client/src/components/home/HomeBeatSection.jsx, client/src/components/home/HomeWeekSection.jsx
