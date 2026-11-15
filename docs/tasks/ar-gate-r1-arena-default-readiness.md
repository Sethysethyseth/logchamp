# TASK ar-gate-r1: REPORT - is the Arena ready to be everyone's default?

STATUS: QUEUED
MODEL: auto
MODE: 1-relay (REPORT LANE - zero repo edits)

CONTEXT:
Gate fuel for the pre-main review of this branch. Until now Arena view was
an opt-in switch (`client/src/lib/arenaPref.js`, `html[data-arena]`, set in
`client/src/components/Layout.jsx`). A sibling unit is making it the
DEFAULT for every device, including people who have never seen it. Your
job is search, not judgment: find every place where the code quietly
assumed "Arena is something a curious user turned on".

FILES TO TOUCH:
- DELIVERY.md at the repo root (the report). NOTHING else. No code edits.

CHANGE (report sections, each finding with file:line and a one-line why):
1. Surfaces OUTSIDE the arena shell: which routes render without
   `Layout.jsx` (login, signup, onboarding, username modal, error
   boundary, loaders, 404)? For each: does anything under
   `html[data-arena]` CSS (`client/src/styles/arena-skin.css`,
   `client/src/components/arena/arena.css`, `index.css`) still apply or
   stop applying there? Does `data-arena` get set before first paint or
   only after an effect (flash of Classic)?
2. Light mode: list every rule or canvas colour in `arena.css`,
   `arena-skin.css`, `arenaEngine.js`, `ArenaStage.jsx` that is fixed-dark
   or reads a theme token; say what a `data-theme="light"` user sees. Do
   the same for each of the five palettes plus `custom`.
3. Desktop / wide screens (>= 900px): what do `Navbar.jsx`, the sheet and
   the stage do? Any rule gated on a phone-only media query?
4. Classic must still be whole: list every change in
   `git diff origin/main...HEAD -- client/src` that is NOT scoped behind
   `data-arena` / `useArenaView()` / `[data-arena]` and touches layout of
   the logger (`SessionDetailPage.jsx`), the Finish dock, `BottomNav.jsx`,
   `RouteTransition.jsx`, `Layout.jsx`. One line each: what changes for a
   Classic user.
5. First-run and empty states under Arena: a brand-new account with zero
   workouts - what do `arenaBoards.js`, `arenaFacts.js`, `arenaEngine.js`
   draw (division by zero, NaN, empty arrays, undefined names)? Quote the
   guards or their absence.
6. Storage keys added on this branch (`localStorage` / `sessionStorage`):
   key, file, what happens when storage throws (private mode).
7. Performance guards: every `requestAnimationFrame` loop in
   `client/src/components/arena/` and `client/src/components/motion/` -
   when does it stop (hidden tab, at rest, reduced motion)? Flag any loop
   with no stop condition.
8. Accessibility: is the stage canvas hidden from assistive tech or
   labelled? Any focusable control inside it without a name?
End with a ranked top-ten list (most likely to hurt a real user first).

ACCEPTANCE CRITERIA:
- `git status --porcelain` shows only DELIVERY.md.
- Every finding has file:line. Claims you could not verify are marked
  UNVERIFIED.

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
