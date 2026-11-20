import { useRef } from "react";
import { SlidingIndicator } from "../../motion/SlidingIndicator.jsx";
import { pickScopeRuns } from "./scopeRuns.js";

/**
 * Scope chips: "All training" + one chip per pickScopeRuns() entry.
 * Same sliding indicator as the range chips.
 */
export function BlockScopeChips({ runs, selectedId, onSelect }) {
  const hostRef = useRef(null);
  const chips = pickScopeRuns(runs);
  const activeKey = selectedId == null ? "all" : String(selectedId);

  return (
    <div
      ref={hostRef}
      className="analytics-range-chips mx-slide-host"
      role="group"
      aria-label="Analytics scope"
    >
      <SlidingIndicator containerRef={hostRef} activeKey={activeKey} />
      <button
        type="button"
        className={`range-chip${selectedId == null ? " is-active" : ""}`}
        aria-pressed={selectedId == null}
        onClick={() => onSelect(null)}
      >
        All training
      </button>
      {chips.map((run) => {
        const id = String(run.id);
        const pressed = selectedId != null && String(selectedId) === id;
        return (
          <button
            key={id}
            type="button"
            className={`range-chip range-chip--scope${pressed ? " is-active" : ""}`}
            aria-pressed={pressed}
            title={run.name || `Block ${run.id}`}
            onClick={() => onSelect(run.id)}
          >
            {run.name || `Block ${run.id}`}
          </button>
        );
      })}
    </div>
  );
}
