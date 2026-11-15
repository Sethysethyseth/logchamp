# TASK ar-gate-r2: REPORT - defect hunt over the Nov 10 direct builds

STATUS: QUEUED
MODEL: auto
MODE: 1-relay (REPORT LANE - zero repo edits)

CONTEXT:
Gate fuel for the pre-main review. Commits `92531ff`, `bc6fa84`,
`479363b`, `7c9edc6`, `e3292cc`, `88a9527`, `a6338da`, `f669edd` (Nov 10)
were written and landed by one seat with no block and no second read.
Read them (`git show <sha> -- client/src`) AND the current state of the
files they touched (later commits changed some). Search, not judgment:
find concrete defects, each with a failure scenario.

Scope files (current state on this branch):
- client/src/components/motion/crownIntroEngine.js, CrownIntro.jsx,
  crownIntroStore.js, crown-intro.css, crown-play.css, CrownEgg.jsx,
  PixelCrown.jsx
- client/src/components/motion/useSwipeDismiss.js, pixelScatter.js,
  client/src/lib/swipeDismiss.js, client/src/lib/workoutBarHidden.js,
  client/src/components/workout/PersistentWorkoutBar.jsx,
  client/src/components/coach/CoachWorkingBar.jsx
- client/src/components/LoadingState.jsx, client/src/components/AuthLayout.jsx
- client/src/components/workout/LoggerLiveStrip.jsx,
  client/src/styles/logger-motion.css, client/src/styles/workout-saved.css,
  client/src/components/workout/StartWorkoutHero.jsx
- client/src/lib/sceneSignal.js and the "Champ Arena" rules in
  client/src/index.css

FILES TO TOUCH:
- DELIVERY.md at the repo root (the report). NOTHING else.

CHANGE (what to look for; every finding = file:line + inputs/state ->
wrong result, and a severity P1 crash or data loss / P2 broken behaviour
/ P3 cosmetic):
1. Listeners, timers, rAF loops, observers and canvases that are not
   torn down on unmount or route change; work that keeps running in a
   hidden tab.
2. Anything that can block or delay input: an overlay that swallows taps
   after its animation ends, a pointer capture never released, the crown
   intro covering the login form or the app if an animation event never
   fires (reduced motion, background tab, bfcache restore).
3. Swipe-dismiss: can a drag discard a workout or lose a coach answer?
   What happens on pointercancel, multi-touch, a drag that starts on a
   button, a drag during the exit animation?
4. Storage: every localStorage / sessionStorage read and write in scope -
   guarded with try/catch? Behaviour in private mode.
5. Reduced motion: every animation in scope has a reduced-motion path
   (CSS media query or `prefersReducedMotion()`); list any that do not.
6. Logged-out and error paths: 401 mid-intro, slow network on first
   sign-in, the loader -> login hand-off when the loader never showed.
7. Tokens-only: any colour literal in scope outside index.css.
End with a ranked list, most severe first. Mark anything you could not
confirm by reading the code as UNVERIFIED. Do not pad: "no defect found
in X" is a valid line.

ACCEPTANCE CRITERIA:
- `git status --porcelain` shows only DELIVERY.md.
- Every finding has file:line and a failure scenario.

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
