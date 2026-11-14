# ARENA critique ledger - the input for one Fable round

STATUS: COLLECTING (Seth is smoking the ARENA wave on his phone; nothing
dispatched). Single writer: Claude Code. Opened Nov 12-13, 2026.

## How this round works (Seth, Nov 13)

Seth: continue with the critiques in mind and have Fable fix everything
at the end in ONE round, instead of going back and forth. "We should be
basing the changes off the artifact and the Fable's instructions."

- **The reference is the artifact.** `docs/design/mocks/motion/
  arena-draft-2.html` (Artifact BxNBepax8Fg99q3sUvaUaU) stays the design
  of record. Every change in this round is judged against it. Where Fable
  changes the design, Fable updates the artifact FIRST, and the updated
  artifact becomes the new design of record.
- **Fable's instructions govern the build.** Fable (Fable 5.2, Cursor
  named rung) makes the creative calls. Its written decisions (in the
  artifact and in the block it hands back) are what the build follows.
  Nobody else re-decides them.
- **One round, two steps, in order:**
  1. DESIGN - Fable reads this whole ledger, decides each DESIGN item,
     and updates the artifact. Seth looks once on his phone: go or
     tweak. (The only stop in the round.)
  2. BUILD - one unit implements the updated artifact plus every FIX
     item, each FIX with a check that proves it. One audit, one landing.
- Standing rules still hold: everything behind Arena view until AR7;
  the ONE MOTION rule; tokens only, all palettes; phone-profile proof at
  412 x 839 and 360 x 740; zero frames at rest; reduced motion honoured.

## Prevention (Seth, Nov 13: "to stop things like this in the first place")

Both findings so far got through the same gaps: proofs ran the idle page
only (no live workout, no typing), and visual rules were written by the
block author instead of drawn in the artifact. From now on (ROADMAP
"ARENA wave", prevention rules; `author-task-block`; `land-unit`):
- The artifact is the spec; Fable draws any missing state there first.
- Every unit proves a STATE MATRIX - idle / live workout / resting /
  finished, keyboard open, full view, strip - with every control on
  screen and usable (type into every text box).
- Visual proof is side by side with the artifact, never app-only.
Fable's build block in this round carries all three.

## Items

Kinds: FIX = broken, must work after the round. DESIGN = Fable's call.

| # | Kind | Where | What Seth saw | Notes |
| --- | --- | --- | --- | --- |
| 1 | FIX | Coach, Arena ON - EVERY visit, live workout or not | "You can't type, can only use recs" - the ask box is not on screen | CONFIRMED in the reviewer's headless smoke Nov 13: at scrollY 0 the composer top is 877px on an 839px screen (412x839) and 760-833 on 740 (360x740); the bottom nav covers 783-839. Arena OFF: 710-783, fine. Cause: `.coach-page` height is 100dvh minus the nav, but under Arena the page starts below the 18svh strip, so the composer lands past the fold. Earlier checks measured with a simulated keyboard / scrolled the box into view, so they passed. |
| 2 | DESIGN | The strip (folded scoreboard), e.g. live clock | "The weird timer background isn't crazy appealing" - huge LED clock on near-black | Fable decides the strip's look; carry the same thinking into the room's boards so they stay one system. |
| 3 | DESIGN | Live logger, Arena ON | (reviewer smoke) the bottom nav lights History while you log a live workout | The logger lives at `/sessions/:id`; the prototype keeps the live workout in Home. Fable: which tab owns the live workout. |
| 4 | DESIGN | Live logger + strip | (reviewer smoke) two running clocks: the strip's big LED clock and the logger's own "LIVE 0:03 · 0 SETS" line right under it | Fable: one clock, or each with a distinct job. Ties to item 2. |
| 5 | DESIGN | Full view, every place | (reviewer smoke; also headless polish note 6, Nov 12) the top ~45% of the full view is empty dark sky above the room | The prototype frames the room taller (fixed 100x178, cam y 3). Fable: framing / what fills the sky. |
| 6 | DESIGN | Sheets that slide up (Finish confirm "1 set has no RIR", start-workout picker, confirm panels) | (reviewer smoke) they keep today's rounded look over the squared Arena skin | AR3 left portaled surfaces outside `#root` as today. Fable: skin them or not. |
| 7 | FIX | Finish a workout, Arena ON | (reviewer smoke) a page error on finish: "Transition was aborted because of invalid state. Viewport size changed" | The room grows back to the open size during the route's view transition. The SAVED moment still plays (SAVED PUSH DAY seen). Find and stop the error without touching the ONE MOTION rule. |

Open calls Fable may settle in the same pass (defaults until ruled):
Coach stays on the strip (prototype opens it tall until the first
question); no swipe-to-walk (prototype has it). AR6 light-mode arena is
a design gap - in scope for this round only if Seth says so.

Add new findings as rows above (next number), in Seth's words.

Reviewer's light smoke (Nov 13, cloud rig on the branch HEAD, champ dark, 412x839 + Coach at 360x740): live workout across all six tabs - every text box reachable and typed into EXCEPT Coach (item 1); logger set -> REST strip + rest bar; rest follows to Analytics; Finish -> SAVED + name in the open room, back to the week face; full view on Home; zero rAF at rest after the save; scrollWidth = innerWidth everywhere checked. Not run headless: light mode, other palettes, reduced motion, a real keyboard.

## Cause confirmed (Nov 14, cloud rig, read-only)

Item 1, Coach composer: CONFIRMED. Arena OFF the page starts at 12px and the
composer spans 710-783 (nav top 783) at 412x839; Arena ON the page starts at
179px and the composer spans 877-950, entirely under the nav. Same +167px at
360x740 (611-684 OFF, 760-833 ON vs nav 684). A live workout changes nothing:
idle and live measure identically, so the workout bar is not the cause. The
offset is the strip (151px) plus the sheet's top inset. Fix is in the build
block (arena.css inset variable used by .coach-page height).

