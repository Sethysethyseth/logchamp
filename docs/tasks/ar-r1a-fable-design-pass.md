# TASK ar-r1a: ARENA round 1, step 1 - Fable's design pass on the artifact

STATUS: QUEUED
MODEL: claude-fable-5-2-high
MODE: 1-relay

CONTEXT:
You are the design seat for LogChamp's ARENA look (Arena view, beta).
Waves AR1-AR5 built `docs/design/mocks/motion/arena-draft-2.html` (the
artifact, design of record) into the app. Seth's first phone smoke and
the reviewer's own smoke produced the critique list
`docs/tasks/ar-critique-ledger.md` - READ IT FIRST, in full, including its
"How this round works" and "Prevention" sections. Seth's ruling (Nov 13):
one round fixes everything, "based off the artifact and the Fable's
instructions". This block is step 1: you make the design calls and draw
them. Step 2 (a separate build block, also yours) implements exactly what
you draw here plus every FIX item. Seth looks at your new artifact once
on his phone between the two steps.

You decide. The ledger's DESIGN items are yours to rule on; the reviewer
will not re-decide them. Push the look where it earns it (Seth's motion
stance in AGENTS.md: "push it", never overbearing, never slows logging).

FILES TO TOUCH:
- docs/design/mocks/motion/arena-draft-3.html   (NEW - copy draft 2,
  then change it; draft 2 stays untouched as history)
- docs/design/mocks/motion/ARENA-ROUND-1.md      (NEW - your rulings and
  the build instructions for step 2)
Do NOT modify anything else - no app code in this step. You MAY read the
app (`client/src/components/arena/`, `client/src/lib/arena*.js`,
`client/src/styles/arena-skin.css`, `client/src/styles/coach-page.css`,
pages) and run it (see Tooling) to see what Seth sees.

CHANGE:
1. Look at the app as it is now, in the cloud smoke rig, beside draft 2:
   every tab idle, a live workout running, resting, just finished, the
   full view, the strip, Coach. Know the gap before you draw.
2. Rule on every DESIGN item in the ledger (today: 2 strip/timer look,
   3 which tab owns the live workout, 4 two clocks, 5 empty sky in the
   full view, 6 sheets that slide up) and on the two open calls (Coach
   open-then-fold vs always strip; swipe-to-walk). Light-mode arena (AR6)
   is NOT in this round - say so, do not draw it.
3. Draw your rulings in `arena-draft-3.html` so every state the build
   must reach is SHOWN, not described: for each place, idle / live
   workout / resting / just finished; the strip in each of those; the
   full view; Coach with its ask box visible at rest and with the
   keyboard open (the FIX item 1 surface - draw where the box lives);
   the Finish confirm sheet. Keep the ONE MOTION rule (camera height
   never changes, the stage rides the sheet's top edge, gap 0, the strip
   fades in place). Keep the draft's state switches (or add them) so
   Seth can step through those states on his phone.
4. Write `ARENA-ROUND-1.md`, the instructions step 2 will build from:
   - one short paragraph per ledger item: the ruling and why (FIX items:
     what "fixed" looks like in the artifact);
   - a STATE MATRIX table: route x state -> what must be on screen and
     usable (every text box typeable, primary buttons pressable);
   - the list of app files step 2 will need to touch, grouped, with a
     one-line reason each (so the reviewer can check collisions);
   - what is explicitly NOT changing.
   Write it for a builder with no chat context. Plain words.
5. The artifact's page conventions stay as draft 2 has them (title, one
   Google Fonts stylesheet, everything else inline, dark first, tokens
   on :root, works at phone width with no horizontal scroll).

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --short --untracked-files=all` lists exactly the two new
  files; `git diff --stat` on `arena-draft-2.html` is empty.
- `arena-draft-3.html` opens in Playwright (Pixel 7 profile) with no
  console errors, `document.documentElement.scrollWidth ===
  window.innerWidth`, and screenshots (paths in DELIVERY.md) of every
  state named in CHANGE 3, contact-sheeted against the same states in
  the app (smoke rig) - side by side.
- `ARENA-ROUND-1.md` has a ruling for every ledger item number and both
  open calls (list the numbers in DELIVERY.md), a state matrix table,
  and the file list.
- `grep -c "<script src" docs/design/mocks/motion/arena-draft-3.html`
  is 0 (no external scripts), and its only external stylesheet is
  Google Fonts.

Tooling (cloud lane): `bash scripts/cloud-smoke-up.sh` from this
worktree's root stands up a local API + seeded smoke account + the Vite
client on port 5173; `scripts/smoke-rig.cjs` drives it (header documents
`open({ arena, theme, palette, reduced })`, `shot`, `geom`, `sheet`).
Pass `arena: true, theme: "dark"`. Open the artifacts with
`page.goto("file://...")`. Throwaway local DB only - never staging,
never prod. Stop the servers before you end your turn.

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
