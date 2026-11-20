# LogChamp prototype kit

Working prototypes built from the REAL app: its full stylesheet and its
rendered markup, captured from the client running in the cloud smoke rig.
A prototype made this way looks exactly like LogChamp (every palette,
Arena and Classic, light and dark) without hand-copying styles. Design
reference only - nothing here is imported by `client/`.

First use: `customize.html` (Profile > Appearance with Look + Customize),
built to `docs/design/mocks/block-lens/customize.html`.

## Refresh the capture (after UI changes)

    bash scripts/cloud-smoke-up.sh                  # app + API + seeded account
    NODE_PATH=$(npm root -g) node docs/design/prototype-kit/capture.cjs docs/design/prototype-kit
    NODE_PATH=$(npm root -g) node docs/design/prototype-kit/extract.cjs docs/design/prototype-kit
    python3 docs/design/prototype-kit/arena-images.py docs/design/prototype-kit
    python3 docs/design/prototype-kit/build.py docs/design/prototype-kit   # -> customize.html

## Files

- `cap/` - raw capture: `app.css` (every stylesheet rule the running
  client had loaded; `build.py` inlines its `/src/assets/` images), the pages (`home.html`,
  `analytics-*.html`, `appearance.html`, `body.html`), a screenshot.
- `modules.json` - Home and Analytics sliced into sections (real markup).
- `arena-images.json` - static arena headers per tab (the canvas itself is
  not in the kit; see `docs/design/mocks/block-lens/` for the prototype).
- `phone.src.html` - the screen. Runs in its own 412px iframe so the app's
  media queries, fixed bottom bar and `#root` stacking behave like a phone.
  Wrap content in `#root`: the scene layer sits above everything else.
- `customize.src.html` - the page around the phone (guide, live summary).
  The phone talks to it with `postMessage`.

For a new prototype: copy the two `.src.html` files, keep the
placeholders (`/*APP_CSS*/`, `/*MODULES_JSON*/null`, `/*IMG_JSON*/null`,
`/*CHILD_JSON*/null`), point `build.py` at your copies.
