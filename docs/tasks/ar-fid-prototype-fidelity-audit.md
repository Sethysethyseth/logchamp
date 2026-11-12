# TASK ar-fid: REPORT - where the Arena in the app differs from the prototype

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Report lane of the ARENA wave. Seth, Nov 12, after smoking ar1 + ar2 on
his phone: "not sure it fully 1 to 1s the artifacts". The prototype of
record is `docs/design/mocks/motion/arena-draft-2.html` (one file, its
script is the spec). The app's Arena lives in
`client/src/components/arena/` (ArenaStage.jsx, arenaEngine.js,
arena.css), `client/src/lib/arenaSheet.js`, `arenaTour.js`,
`arenaPref.js`, and `client/src/components/Layout.jsx`. One difference
is already known and being fixed in another lane (the open-size heights:
the prototype's `PLACES[..].sheet` is the sheet's share, the app used it
as the room's) - list it, do not dwell on it.

FILES TO TOUCH:
- none. REPORT ONLY - no code changes, no git operations.

CHANGE:
Read the prototype's script and the app's Arena code side by side and
write a difference list to DELIVERY.md. For every difference give: what
the prototype does (line numbers in the html), what the app does
(file:line), and whether it is (a) the room's drawing, (b) sizes and
motion, (c) what the boards / strip / one-line summary say, (d) the
sheet's own look (the prototype's squared panels, rules, type), or
(e) behaviour the prototype has and the app lacks. Cover at least:
- every place's drawing, element by element (platform, towers,
  scoreboard, stands and seats, chalkboard, rack and program board,
  lockers and banners): positions, sizes, ramp steps, anything drawn in
  one and not the other;
- world size, place spacing (`PLACES[..].x` vs `ARENA_PLACES`), pixel
  scale on a phone, camera framing;
- when the stage folds and opens (`foldDefault`, `folded`,
  `sheetFrac`, `applySize`, `syncScroll`) vs `arenaSize` and the
  scroll ride; the coach route; a block open in the Library;
- the strip / marquee text per state (`marqueeLines`, `drawMarquee`)
  vs `stripFace`; the one-line summary (`PEEK`) vs `peekLine`;
- the eggs and carried motion (`logChamp`, `cheer`, `crownTap`,
  `s.lift`, `s.rain`, towers, set flash, finish flash);
- the sheet's skin in the prototype that the app has not built yet
  (list the CSS rules that define it) - this feeds the next unit.
End with a ranked top ten: the differences a person would notice first
on a phone.

ACCEPTANCE CRITERIA (machine-checkable):
- DELIVERY.md exists at the repo root and holds the difference list in
  the five groups above, every entry with a prototype line number and an
  app file:line (or "not in the app" / "not in the prototype").
- `git status --short` shows no tracked file modified.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
