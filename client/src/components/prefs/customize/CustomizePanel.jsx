import { useState } from "react";
import { resetLayoutScreen, useLayout } from "../../../lib/layoutPref.js";
import { EyeIcon, GripIcon, MinusIcon, PlusIcon } from "./icons.jsx";
import { HomeCustomizeCanvas } from "./HomeCustomizeCanvas.jsx";
import { AnalyticsCustomizeCanvas } from "./AnalyticsCustomizeCanvas.jsx";
import { PreviewOverlay } from "./PreviewOverlay.jsx";

/**
 * Customize tab: Home | Analytics switch, hint, editor canvas, sticky dock.
 * Prototype: phone.src.html ~296-300.
 */
export function CustomizePanel() {
  const layout = useLayout();
  const [czScreen, setCzScreen] = useState("home");
  const [aView, setAView] = useState("muscles");
  const [preview, setPreview] = useState(false);

  return (
    <div className="ap-panel" role="tabpanel" aria-label="Customize">
      <div className="cz-switch" role="tablist" aria-label="Screen">
        {[
          ["home", "Home"],
          ["analytics", "Analytics"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={czScreen === id}
            onClick={() => setCzScreen(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="cz-hint">
        <span>
          <span className="cz-tg">
            <MinusIcon />
          </span>
          hide
        </span>
        <span>
          <span className="cz-tg cz-hint-plus">
            <PlusIcon />
          </span>
          show
        </span>
        <span>
          <span className="cz-grip">
            <GripIcon />
          </span>
          hold or drag to move
        </span>
      </p>

      <div className="cz-canvas">
        {czScreen === "home" ? (
          <HomeCustomizeCanvas home={layout.home} />
        ) : (
          <AnalyticsCustomizeCanvas
            analytics={layout.analytics}
            aView={aView}
            onViewChange={setAView}
          />
        )}
      </div>

      <div className="cz-dock">
        <button
          type="button"
          className="cz-reset"
          onClick={() => resetLayoutScreen(czScreen)}
        >
          Reset
        </button>
        <button type="button" className="cz-preview" onClick={() => setPreview(true)}>
          <EyeIcon />
          Preview {czScreen === "home" ? "Home" : "Analytics"}
        </button>
      </div>

      {preview ? (
        <PreviewOverlay screen={czScreen} onClose={() => setPreview(false)} />
      ) : null}
    </div>
  );
}
