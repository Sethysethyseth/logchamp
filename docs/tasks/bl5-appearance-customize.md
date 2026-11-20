# TASK bl5: Appearance rework + Customize - hide, show, reorder and preview Home and Analytics

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Block Lens wave (BL). AFTER bl2 AND bl4 land (this unit reads bl2's
`client/src/lib/screenLayout.js` registry and edits the same pages).
Seth (Nov 20): rework Profile > Appearance so it looks good and is easy
to navigate, keep everything it has today, and add a Customize tab that
shows the Home and Analytics screens with a minus / plus on each section
(hidden sections gray out, shown ones keep their colour), a way to move
sections (like moving apps on a phone's home screen), and a Preview that
shows the real screen without the gray. Motion: smooth and polished,
never over the top, never delays input, reduced motion honoured.
DESIGN OF RECORD - this is a judgment-heavy visual unit, the prototype IS
the spec: `docs/design/mocks/block-lens/customize.html` (open it; it runs).
Its source is `docs/design/prototype-kit/phone.src.html` (CSS + JS for
every interaction); its contract table (bottom of the page) lists the
section ids and defaults. Quote the source by line when you match it.

FILES TO TOUCH:
- client/src/pages/profile/AppearancePage.jsx
- client/src/components/prefs/customize/          (new: Customize tab,
                                                    section editor, preview)
- client/src/lib/screenLayout.js                  (add ANALYTICS_SECTIONS
                                                    + the stored layout)
- client/src/lib/layoutPref.js                    (new: storage store)
- client/src/pages/DashboardPage.jsx              (read the stored layout)
- client/src/pages/AnalyticsPage.jsx              (render from the layout)
- client/src/styles/customize.css                 (new, tokens only) +
  the one import line where the page imports its styles
Do NOT modify anything outside these files.

CHANGE:
1. Appearance page = two tabs, "Look" and "Customize", with the sliding
   indicator (prototype `.ap-tabs`, lines 22-27).
   - Look: everything Appearance has today, re-laid out as the prototype
     draws it - Arena / Classic as two picture cards (Arena thumb = the
     room, Classic thumb = the card sketch), Theme (Light / Dark / System)
     only under Classic, Accent color as a row of five swatches, the
     "This device only" note, and a "Customize Home and Analytics" row
     that opens the Customize tab. Same behaviour as today (`setArenaView`,
     `useTheme`, palettes; the hidden studio stays hidden behind
     `SHOW_STUDIO`; a saved custom palette still lists).
   - Customize: Home | Analytics switch, the hint row, the screen's
     sections each wrapped in an editor frame (grip, name, Hidden tag,
     minus/plus), a sticky dock with Reset and "Preview <screen>".
2. Sections and defaults (the contract - same ids as the prototype):
   - Home (bl2's `HOME_SECTIONS`): start (locked: moves, never hides),
     upnext, week, beat (on), due (OFF), highlights, recent.
   - Analytics `ANALYTICS_SECTIONS`: top of page `tiles`, `coach`; per
     view: muscles [volume, balance, quality], strength [trends, quality],
     exercises [explorer], execution [execution, quality]. `quality` is
     ONE switch for every view it appears in. Order is per list.
     A view whose sections are all hidden loses its tab (the first
     remaining view becomes the default). Block scope (bl4) is not
     customizable - it ignores this layout.
   - In the editor, sections render as the real components with pointer
     events off (no navigation, no fetch side effects beyond what the
     page does already); Up next shows only if a block runs.
3. Storage: `layoutPref.js` follows `arenaPref.js` by name
   (`useSyncExternalStore`, a change event, `storage` listener, try/catch
   for private mode). Key `workoutdb-layout` (rename boundary: keep the
   prefix), value `{ v: 1, home: [{id,on}], analytics: { top: [...],
   views: { muscles: [...], ... } } }`. Device-local, like the rest of
   Appearance. `resolveLayout` (bl2) merges stored with registry, so new
   sections in a later release appear with their defaults. Home and
   Analytics read it and re-render live.
4. Interactions and motion - match the prototype:
   - minus / plus: one icon that morphs (the vertical stroke folds,
     lines 84-87); the section grays (grayscale, ~33% opacity, scale .98,
     300ms, line 91) and a "Hidden" tag shows. Reset per screen.
   - move: press the grip OR press and hold anywhere on a section for
     320ms (moving >8px first cancels, so the page still scrolls). The
     section lifts (scale 1.035, ring + shadow, solid background, lines
     67-72), follows the finger 1:1, the others glide out of the way
     (FLIP, 300ms, line 64), the page auto-scrolls near the edges, and on
     release it springs into its slot (420ms cubic-bezier(.3,1.3,.5,1)).
     Short `navigator.vibrate(8)` where supported. While a section is up
     the page must not scroll under the finger. Arrow keys on the grip
     move it one step (FLIP too). Moving the node must keep pointer
     capture (the prototype re-takes it after each insert - lines near
     `place()`).
   - Preview: overlay with the screen exactly as it will render (Arena
     header + live components, hidden sections gone, entrance cascade as
     the real page), a "Back to editing" pill; Esc closes it.
   - Reduced motion: no lift scale, no springs, no glide, no fades - order
     and state still change instantly; nothing waits on an animation.
   - Never delays input: every action applies on tap; animations are
     transform/opacity only.
5. Accessibility: grip is a button "Move <name>. Use arrow keys";
   toggle is a button with aria-pressed and "Hide / Show <name>"; the
   locked section's button is disabled "<name> is always shown"; tabs
   are a tablist.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean; `node scripts/check-hex.mjs` clean;
  `npm run test:unit` green from `server/` (unchanged count).
- Node one-liners (output in DELIVERY.md): `resolveLayout` keeps a stored
  order and on/off, drops unknown ids, appends new registry ids with
  defaults, forces `start` on; analytics: hiding volume + balance +
  quality hides the Muscles tab and the page opens on Strength.
- Cloud smoke rig, Arena + Classic (light and dark), champ + forest,
  412 and 360 wide, raw touches for holds and drags:
  - contact sheet of Look and Customize beside the prototype at the same
    states (Look, Customize Home, Customize Analytics, Preview).
  - a hold-and-drag moves "Beat last time" above "This week": frames at
    press, lifted, mid-drag (neighbour gliding), released, settled -
    contact sheet. Order persists after reload; Home renders it.
  - hide Highlights + show Due -> Home renders Due, no Highlights; the
    8-week summary request appears only now (bl2 contract).
  - hide every Muscles section -> the Muscles tab is gone on Analytics.
  - a short vertical swipe that starts on a section scrolls the page (no
    lift).
  - reduced motion: no transform animations run (computed transitions
    none on `.cz-*`), all actions still work.
  - STATE MATRIX with every control on screen and usable: Look, Customize
    Home with a live workout running (Active hero shown in the editor),
    with a block running (Up next shown), Customize Analytics on each
    view, Preview of each screen; zero console errors;
    `scrollWidth == innerWidth`.

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
