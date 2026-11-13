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
| 1 | FIX | Coach, Arena ON, live workout running | "You can't type, can only use recs" - the ask box is not on screen (Nov 12 phone shot: strip shows the live clock, no composer above the nav) | Lead hypothesis, unverified: `.coach-page` is sized to 100dvh minus the nav, so the stage strip (+ workout bar) push the composer under the bottom nav. Headless AR1/AR3 checks passed only WITHOUT a live workout. |
| 2 | DESIGN | The strip (folded scoreboard), e.g. live clock | "The weird timer background isn't crazy appealing" - huge LED clock on near-black | Fable decides the strip's look; carry the same thinking into the room's boards so they stay one system. |

Open calls Fable may settle in the same pass (defaults until ruled):
Coach stays on the strip (prototype opens it tall until the first
question); no swipe-to-walk (prototype has it). AR6 light-mode arena is
a design gap - in scope for this round only if Seth says so.

Add new findings as rows above (next number), in Seth's words.
