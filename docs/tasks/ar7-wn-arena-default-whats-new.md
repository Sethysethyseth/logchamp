# TASK ar7-wn: Arena is the default look + the What's New release that introduces it

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Last unit before this branch goes to main (Seth, Nov 15). Two things in one
unit because the second explains the first: (A) Arena view stops being an
opt-in beta and becomes the look every device opens in, with Classic one
tap away; (B) the What's New release that tells lifters so. Seth's brief
for the release, verbatim: "the feel should be the same, just looks
better", and "if users like the old look make sure to tell them they can
always switch back in appearance". The release also covers everything
else in `docs/releases/UNRELEASED.md` (both sections). This block follows
the standing `docs/tasks/_WHATS_NEW.md` rules; where the two differ, THIS
block wins.

FILES TO TOUCH:
- client/src/lib/arenaPref.js                       (default flips to on)
- client/src/pages/profile/AppearancePage.jsx       (the Arena section only)
- scripts/smoke-rig.cjs                              (the one arena localStorage line)
- client/src/data/whatsNew.js                        (PREPEND one release; header comment gains the `action` field)
- client/src/components/whatsnew/WhatsNewModal.jsx  (render the optional `action`)
- client/src/components/whatsnew/WhatsNewContent.jsx (render the optional `action` on the archive page)
- client/src/styles/whats-new.css                    (only if the action link needs a rule; tokens only)
- server/data/app-guide.md                           (Arena + the ledger's changes)
Do NOT modify anything outside these files.

CHANGE:

A. Arena is the default (`client/src/lib/arenaPref.js`)
1. The stored value now has three states under the SAME key
   (`workoutdb-arena`): `"1"` = Arena, `"0"` = Classic, absent or anything
   else = Arena (the default).
2. `readArenaView()` returns `false` only when the stored value is `"0"`;
   when storage throws it returns `true`.
3. `setArenaView(false)` WRITES `"0"` (it no longer removes the key);
   `setArenaView(true)` writes `"1"`. Event dispatch unchanged.
4. `useArenaView`'s server snapshot becomes `() => true`. Fix the file's
   header comment (no "beta", no "Off by default").
5. Nothing else in the client may read the key directly (today nothing
   does - keep it that way).
6. `scripts/smoke-rig.cjs`: the init script must set the key in BOTH
   cases: `"1"` when its arena flag is on, `"0"` when it is off, so the
   rig's Classic runs stay Classic.

B. Appearance page (`AppearancePage.jsx`, the `settings-arena-heading`
   section only)
1. Heading: `Arena view` (drop "(beta)").
2. Options in this order: `Arena`, then `Classic`. Same segmented control,
   same classes, same radio semantics.
3. Hint text, exactly: "The arena sits at the top of every screen and
   each tab is a place in it. Everything works the way it did. Prefer the
   old look? Choose Classic. This device only."

C. The release (`client/src/data/whatsNew.js`, prepended)
- `id`: `2026-11-arena`   `date`: `2026-11-15`
- `title`: `A new look: the Arena`
- `tagline`: `The feel is the same. It just looks better.`
- `action`: `{ label: "Change the look in Appearance", to: "/profile/appearance" }`
  (new optional field - see D).
- `sections` - exactly two headings, five bullets total. The first three
  bullets are FIXED COPY; use them word for word:
  - heading `The Arena`
    1. "LogChamp now opens in the Arena: a pixel gym at the top of every screen. Each tab is a place in it."
    2. "Everything works the way it did. Your workouts, numbers and settings are right where you left them."
    3. "Prefer the old look? Go to Profile, then Appearance, and choose Classic. You can switch back any time."
  - heading `Also new` - you write these two, 25 words or fewer each,
    from the ledger:
    4. Analytics moving (cards rise in, numbers roll up, charts draw; tap
       an exercise to open its details right under it).
    5. The coach keeps working while you do something else, tells you
       when it has answered, and chats are saved in History.
- `details` - you write these from the ledger, one entry per change worth
  explaining, in this order. Every Arena entry describes the app as it is
  AFTER this block: the Arena is simply how LogChamp looks. Never tell
  the reader to turn Arena on, and never write "beta".
  1. `Switching back to Classic` - FIRST. What Classic is (the look from
     before this update), that nothing is lost either way, that the
     choice is per device. `where`: "Profile, then Appearance, then Arena
     view".
  2. The places: which tab is which place (read `arenaEngine.js` /
     `ArenaStage.jsx` for the real names - platform, scoreboard, stands,
     and so on) and what each board shows from your own numbers.
  3. Scrolling and the full view: the room folds to a strip or a rail as
     you scroll; tap the arena for the full view; hold or pinch to look
     closer.
  4. Logging in the Arena: one row (name, Setup, X), the quick chip row,
     the scoreboard strip as the workout's clock and rest timer, Finish
     at the end of the page. Read `SessionDetailPage.jsx` for the labels.
  5. Motion everywhere else (tab slides, History card growing into its
     summary, Analytics).
  6. Coach (keeps working, the bar, saved chats, the question box above
     the keyboard).
  7. Small things (swipe the bars away, steadier typing while logging).
  Merge or drop entries the code does not support; list every merge and
  skip in DELIVERY.md. All `_WHATS_NEW.md` copy rules apply (step 3
  there), including: no exclamation marks, no hype, "you", sentence case.

D. The optional `action` field (modal + archive page)
1. Shape: `action?: { label: string, to: string }` - an in-app route.
   Document it in the `whatsNew.js` header comment next to `details`.
   Releases without it render byte-for-byte as today.
2. `WhatsNewModal.jsx`: when the release has an `action`, render it as a
   react-router `Link` directly under the sections, inside the scrolling
   area (NOT in the footer - the footer's two buttons and "See all
   updates" stay as they are). Clicking it calls `onDismiss` (so the
   release is marked seen) and navigates to `action.to`.
3. `WhatsNewContent.jsx`: the archive page shows the same link under that
   release's concise sections. No dismiss needed there.
4. Style: reuse an existing link/button class if one fits
   (`btn btn-secondary btn--compact` is the house pattern). Any new CSS is
   tokens-only and must hold under both `html[data-arena]` and Classic.

E. App guide (`server/data/app-guide.md`)
1. Appearance line: add Arena view (Arena is the default look; Classic is
   the earlier look; Profile, then Appearance; per device).
2. Add a short Arena section: what it is, the places per tab, the full
   view, how logging differs (strip = clock and rest timer, Finish at the
   end of the page).
3. Apply the ledger's other how-to changes (coach chats live in History,
   swipe the bars away).
4. The file is at 11,792 characters and the cap is 12,000: trim older,
   wordier passages to make room. Do not delete facts.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
  `node scripts/check-hex.mjs` clean.
- arenaPref, proven with a node one-liner in DELIVERY.md (stub
  `localStorage` and `window`, import the module): absent -> true; "1" ->
  true; "0" -> false; "junk" -> true; after `setArenaView(false)` the
  stored value is "0" and `readArenaView()` is false; after
  `setArenaView(true)` it is "1"; a `localStorage` whose `getItem` throws
  -> true.
- `grep -rn "workoutdb-arena\"" client/src` hits only `arenaPref.js`.
- `grep -n "beta" client/src/pages/profile/AppearancePage.jsx
  client/src/lib/arenaPref.js` returns nothing.
- `whatsNew.js`: every existing entry is byte-identical; the new entry is
  `RELEASES[0]`; bullets 1-3 match this block exactly; 5 bullets total,
  each 25 words or fewer (count them in DELIVERY.md); `tagline` 14 words
  or fewer.
- In the new copy: `grep -inE "endpoint|\bapi\b|schema|migration|component|\bar[0-9]|mx[0-9f]|\.jsx|workoutdb|beta|!"`
  returns zero hits (the `id`/`to` lines aside).
- A release WITHOUT `action` renders the same markup as before in both
  the modal and the page (show the conditional in DELIVERY.md).
- `wc -c server/data/app-guide.md` is under 12000.
- DELIVERY.md quotes the new release in full and has a table of every
  ledger entry with where it went (bullet / detail) or why it was skipped.

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
