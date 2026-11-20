import champScene from "../../../assets/scenes/champ.png";
import { CUSTOM_PALETTE_ID } from "../../../lib/customPalette.js";
import { setArenaView, useArenaView } from "../../../lib/arenaPref.js";
import { useTheme } from "../../../context/ThemeContext.jsx";

const PALETTE_OPTIONS = [
  { value: "champ", label: "Champ" },
  { value: "iron", label: "Iron" },
  { value: "forest", label: "Forest" },
  { value: "crimson", label: "Crimson" },
  { value: "chill", label: "Chill" },
];

/**
 * Look tab: Arena/Classic picture cards, Theme under Classic, accent
 * swatches, device note, Customize row. Prototype: phone.src.html ~285-294.
 */
export function LookPanel({ onOpenCustomize, studioSlot }) {
  const arenaView = useArenaView();
  const {
    theme,
    setTheme,
    palette,
    setPalette,
    resolved,
    customPalette,
    preview,
    previewPalette,
  } = useTheme();

  const customSwatch = customPalette
    ? (resolved === "dark" ? customPalette.dark : customPalette.light).interactive
    : null;

  return (
    <div className="ap-panel" role="tabpanel" aria-label="Look">
      <div>
        <h2 className="ap-h">Look</h2>
        <div className="ap-looks" role="radiogroup" aria-label="Look">
          <button
            type="button"
            className="ap-look"
            role="radio"
            aria-checked={arenaView}
            onClick={() => setArenaView(true)}
          >
            <span className="ap-look__thumb">
              <img src={champScene} alt="" />
            </span>
            <b>Arena</b>
            <span>The new look, with its own lighting. Always dark.</span>
          </button>
          <button
            type="button"
            className="ap-look"
            role="radio"
            aria-checked={!arenaView}
            onClick={() => setArenaView(false)}
          >
            <span className="ap-look__thumb">
              <span className="ap-look__classic" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <b>Classic</b>
            <span>The look from before, light or dark.</span>
          </button>
        </div>
      </div>

      {arenaView ? null : (
        <div>
          <h2 className="ap-h">Theme</h2>
          <div className="ap-seg" role="radiogroup" aria-label="Theme">
            {[
              ["light", "Light"],
              ["dark", "Dark"],
              ["system", "System"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="ap-h">Accent color</h2>
        <div className="ap-swatches" role="radiogroup" aria-label="Accent color">
          {PALETTE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ap-swatch"
              role="radio"
              aria-checked={palette === option.value && !preview}
              onClick={() => {
                previewPalette(null);
                setPalette(option.value);
              }}
            >
              <span
                className={`settings-palette-swatch settings-palette-swatch--${option.value}`}
                aria-hidden="true"
              />
              {option.label}
            </button>
          ))}
          {customPalette ? (
            <button
              type="button"
              className="ap-swatch ap-swatch--custom"
              role="radio"
              aria-checked={palette === CUSTOM_PALETTE_ID && !preview}
              style={{ "--ap-custom-swatch": customSwatch }}
              onClick={() => {
                previewPalette(null);
                setPalette(CUSTOM_PALETTE_ID);
              }}
            >
              <span className="settings-palette-swatch" aria-hidden="true" />
              {customPalette.name}
            </button>
          ) : null}
        </div>
      </div>

      <p className="ap-note">Everything works the same in both looks. This device only.</p>

      <div>
        <h2 className="ap-h">Layout</h2>
        <button type="button" className="ap-row-link" onClick={onOpenCustomize}>
          <span>
            <b>Customize Home and Analytics</b>
            <small>Hide, show and reorder what&apos;s on each screen</small>
          </span>
          <span className="ap-row-link__chev" aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      {studioSlot}
    </div>
  );
}
