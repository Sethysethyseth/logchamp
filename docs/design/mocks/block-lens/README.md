# Block Lens wave - design reference

Reference pack for the BL task blocks. Design reference only: never import
anything here from `client/src/`.

Captured Nov 20, 2026 from the real app in the cloud smoke rig (Pixel 7,
Arena, champ, seeded smoke account - test data, not Seth's).

- `plan.html` - the wave plan (problem, decisions, units). Seth's rulings:
  the coach's corner leaves the arena; Analytics gets its own place;
  Home: Beat last time ON by default, Due OFF by default (Nov 20). Home
  and Analytics sections become modules the user can add, remove and
  reorder from Profile > Appearance > Customize (prototype next).
- `preview.html` - the visual preview: draggable swipe sequence (today vs
  new room), each tab's place, the Home and block-analytics mock-ups.
  Open it from this folder; it loads `frames/` and `mock/` relatively.
- `arena-in-tab-order.prototype.diff` - BL1's starting point. Applies to
  `client/src/components/arena/` at the commit it was made on and RUNS
  (build green; the frames in `frames/new` and `mock/new-*` are this diff).
  Prototype quality: the rack / locker shift is a blunt +104 on literals,
  and nothing is tested. BL1 owns cleaning it up, not copying it blind.
- `frames/{old,new}/00-16.jpg` - a full swipe Home -> Profile: frames
  0/4/8/12/16 are the five tabs settled, the three between each pair are
  mid-drag with the page under the finger.
- `mock/new-*.jpg`, `mock/old-*.jpg` - each tab's place, new room vs today.
- `mock/home-1.jpg`, `mock/home-2.jpg` - BL2 target: "This week" card
  (Workouts, PRs, Due, Beat last time). `mock/today-h2.jpg` is the card it
  replaces.
- `mock/block-1.jpg`, `mock/block-2.jpg` - BL4 target: Analytics in block
  scope (scope chips, progress ring, Since week 1 tiles, sets logged of
  planned, per-side top-set chart with the planned line). Numbers are
  examples. `mock/today-a1.jpg` is today's page top.

The Home and block screens are markup injected into the live pages with
the app's own classes and tokens - match the layout, hierarchy and copy;
implement them properly (tokens only, all palettes, motion per the
analytics views).
