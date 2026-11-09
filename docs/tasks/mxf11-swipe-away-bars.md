# TASK mxf11: Swipe the resume-workout bar and the coach bar away (IDEAS 16, Seth's rulings Nov 9)

STATUS: QUEUED
MODEL: claude-fable-5-1-thinking-high
MODE: 1-relay

CONTEXT:
Motion wave (`motion-wave`), the last content unit before the wave's What's
New unit. IDEAS 16 (`docs/design/mocks/motion/IDEAS.md`, Seth Oct 10, HELD
until now) asked that the two floating bars can be flicked away without
losing anything. Seth's rulings, Nov 9 2026 (these override IDEAS 16 where
they differ):
1. SIDEWAYS ONLY - left or right. Vertical drags belong to page scrolling
   and must never move or dismiss a bar.
2. Resume-workout bar (`PersistentWorkoutBar`): a swipe HIDES it until the
   next app open (a new browsing session); the workout itself is untouched
   and stays on Home's resume card. The bar's existing X keeps meaning
   DISCARD (with its ConfirmPanel) - a swipe never discards.
3. Coach bar (`CoachWorkingBar`): a swipe hides it in ANY phase, including
   "Coach is working on it". If it was hidden while working and the answer
   then finishes (or errors), the bar comes back ONCE as "Coach answered"
   (or the error state). Hiding a finished/errored bar keeps it hidden.
   The answer is always saved (History > Coach) - unchanged.
Design voice: MOTION-DIRECTION.md (`docs/design/mocks/motion/`) - motion
should feel great on a mid-range phone, never delay input, honour
`prefers-reduced-motion`. You are the designer for the FEEL (drag follow,
fade, throw-out, spring-back); the rules above and the criteria below are
fixed.

FILES TO TOUCH:
- client/src/lib/swipeDismiss.js            (NEW - pure decision helpers,
                                             no DOM, no React; contract below)
- client/src/components/motion/useSwipeDismiss.js  (NEW - pointer-events
                                             hook both bars share; zero deps)
- client/src/components/workout/PersistentWorkoutBar.jsx
- client/src/components/coach/CoachWorkingBar.jsx
- client/src/context/CoachSessionContext.jsx (dismissBar semantics only)
- client/src/styles/workout-bar.css, client/src/styles/coach-working-bar.css
- client/src/index.css (ONLY the rules that reserve bottom space for the
  workout bar, if hiding it needs them to collapse)
Do NOT modify anything outside these files.

CHANGE:
1. `client/src/lib/swipeDismiss.js` exports two pure functions:
   - `lockAxis({ dx, dy, slop = 8 })` -> `"x"` when |dx| > slop and
     |dx| > |dy|; `"y"` when |dy| > slop and |dy| >= |dx|; otherwise `null`
     (undecided).
   - `decideSwipe({ dx, width, velocityX })` -> `"dismiss"` or `"return"`.
     Dismiss when |dx| >= 35% of `width`, OR when |dx| >= 24 and
     |velocityX| >= 0.5 px/ms with the same sign as dx (a fling). Otherwise
     return. velocityX is px/ms.
2. `useSwipeDismiss` (pointer events, `touch-action: pan-y` on the element
   so the browser keeps vertical scrolling): undecided until `lockAxis`
   decides; `"y"` -> abandon the gesture for this pointer (no transform,
   page scrolls); `"x"` -> the bar follows the finger horizontally and
   fades with distance. On release, `decideSwipe` picks: dismiss -> the bar
   leaves in the thrown direction, then the caller's `onDismiss` runs;
   return -> it springs back. A gesture that locked to x must NOT fire the
   click of whatever it started on (Resume, open coach, X). A tap (no
   lock) still clicks normally. Pointer cancel = spring back. Reduced
   motion: same gesture recognition, but no follow/fade/throw animation -
   past the threshold it simply disappears, otherwise nothing moves.
   Follow the reduced-motion hook BY NAME (`useReducedMotion`) and the
   `--mx-*` timing tokens from `analytics-motion.css` / shell motion.
3. Resume-workout bar: swipe -> hidden for this browsing session, keyed by
   the active session's id in `sessionStorage` (key
   `workoutdb-workout-bar-hidden`, value = that session id; wrap every
   storage access in try/catch - a throw means "not hidden"). A different
   active session id shows the bar again. While hidden, no empty gap is
   left where the bar was (any reserved bottom padding collapses). Home's
   resume card, the workout page, finishing and discarding are unchanged.
4. Coach bar: `dismissBar` in `CoachSessionContext` accepts the
   "working" phase too. The existing finish/error path that resets
   `dismissed: false` is what makes the bar return once as answered -
   keep it. The coach bar's X (where shown) and the swipe do the same
   thing. Works in both placements (bottom bar and the top chip during a
   live workout).
5. No new dependencies. Tokens only (no hex). `card--live` untouched.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` (repo root) passes.
- `npm run test:unit` from `server/` green (sanity).
- From `client/`, this prints exactly
  `x y null dismiss return dismiss return return`:
  `node --input-type=module -e "import {lockAxis as l, decideSwipe as d} from './src/lib/swipeDismiss.js'; console.log(l({dx:12,dy:3}), l({dx:3,dy:12}), l({dx:4,dy:3}), d({dx:150,width:358,velocityX:0.1}), d({dx:60,width:358,velocityX:0.1}), d({dx:-40,width:358,velocityX:-0.8}), d({dx:10,width:358,velocityX:1.2}), d({dx:40,width:358,velocityX:-0.8}))"`
- Static: the swipeable elements carry `touch-action: pan-y`; both bars
  use `useSwipeDismiss`; `PersistentWorkoutBar` reads/writes
  `workoutdb-workout-bar-hidden` inside try/catch; `dismissBar` no longer
  returns early for the "working" phase.
- Behaviour walk-through in DELIVERY.md (no browser in the lane - code
  path evidence): (a) horizontal drag 150 px on a 358 px workout bar ->
  hidden, sessionStorage holds the session id, reload keeps it hidden, a
  new session id shows it; (b) vertical drag 120 px starting on either bar
  -> page scrolls, bar unmoved, nothing hidden; (c) swipe starting on the
  workout bar's X -> hides, never opens the discard confirm; (d) coach bar
  swiped while working -> hidden; answer finishes -> "Coach answered" bar
  visible again; swiped again -> stays hidden; (e) reduced motion -> no
  transform/opacity animation, threshold still hides.

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
