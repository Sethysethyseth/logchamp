# ARENA wave - brief for the Opus seat (Seth, Nov 12, 2026)

Carry the ARENA wave from AR3 to wave end. You are the frontier seat:
author the blocks, dispatch them to Cursor, land them. The final
pre-main review is NOT yours - Seth has reserved it for a later session.

## Read first (in this order, nothing else up front)

1. `docs/HANDOFF.md` - top two notes (Nov 12).
2. `docs/design/mocks/motion/ROADMAP.md` - "ARENA wave (AR)" table.
3. `docs/tasks/ar-fid-FINDINGS.md` - prototype vs app, ranked top ten.
   This is your recon; do not redo it.
4. `docs/tasks/ar2f-arena-open-size-and-strip-polish.md` - the shape of a
   good block for this wave (contract, node check, phone-profile proof).

Design of record: `docs/design/mocks/motion/arena-draft-2.html`. Where
the app and the prototype differ and nobody has ruled, the prototype wins.

## Branch and environment

- Work on `claude/inspiring-darwin-s2cr9p` (holds motion-wave + AR1,
  AR2, AR2f). Do not merge anywhere; no PR.
- Cloud session on the `logchamp` environment. Dispatch = `dispatch-unit`
  section 2d. Lanes: `/home/user/worktrees/cursor-lane` (`-2`, `-3`).
  A lane may hold an old gitignored `DELIVERY.md` - delete it before a
  dispatch, or a monitor fires on the stale file.
- `MODEL: opus` blocks run with `--model claude-opus-5-5-medium`.

## The units (in order)

- **AR3 - the page's skin under Arena view.** The prototype's squared
  panels, accent rules and display face, as ONE stylesheet scoped to
  `html[data-arena]`, over the existing pages; Home and the logger
  first. Spec = FINDINGS group (d). Tokens only, all 5 palettes, dark
  first. Seth's Draft 2 nitpick notes have not arrived: do not wait -
  ask once at the start, and if there is no answer build from the
  prototype.
- **AR4 - boards from real data.** FINDINGS top ten items 4-7: the four
  Analytics faces on the board, Home week faces (top set, top gain,
  records), the running block and week on the program board, the
  chalkboard (thinking dots, answer headline). Only data the page
  already has; no new endpoints.
- **AR5 - places.** History seat follows the selected workout; near
  stands as the prototype draws them (item 3); banners from real
  milestones; strip headlines for Library and Profile.
- **AR-WN - What's New unit** from `docs/tasks/_WHATS_NEW.md`, last.

AR3 touches stylesheets + pages; AR4 and AR5 both touch
`client/src/components/arena/` - AR4 then AR5, serial. AR3 may run
beside AR4 if FILES TO TOUCH are fully disjoint.

## Not in this run

- **AR6 light-mode arena** - design gap, needs a prototype Seth has seen.
- **AR7 Arena as the default** - Seth's call after smoke.
- **Two open calls, default until Seth rules:** Coach stays on the strip
  (do not open it tall); no swipe-to-walk. Do not build either.

## Every block must carry

- Everything behind Arena view; with the switch off the app renders as
  today (state the proof).
- The ONE MOTION rule untouched: camera height never changes, the stage
  rides the sheet's top edge, gap 0.
- Phone-profile proof at 412 x 839 and 360 x 740: `scrollWidth ===
  innerWidth`, screenshots, zero frames at rest.
- Reduced motion honoured; `node scripts/check-hex.mjs` clean.

## Landing

`land-unit`, plus the cloud smoke rig for the visual audit (REFERENCE,
"Cloud smoke rig"): `bash scripts/cloud-smoke-up.sh`, then drive
`scripts/smoke-rig.cjs`. To audit a lane's delivery, serve THAT lane's
client on port 5173 (the API only allows that origin). Pass
`theme: "dark"` - the rig otherwise comes up light. Look at contact
sheets beside the prototype before you commit.

## Stop

When AR3, AR4, AR5 and AR-WN are landed: one consolidated phone smoke
checklist for Seth (AR2f's list from HANDOFF included), HANDOFF current,
then STOP. No branch review, no merge prep. Two bounces on one unit, or a
block that needs a decision this brief does not make -> stop and ask.
