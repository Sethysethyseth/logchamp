import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DashboardPage } from "../../../pages/DashboardPage.jsx";
import { AnalyticsPage } from "../../../pages/AnalyticsPage.jsx";

/**
 * Full-screen preview of Home or Analytics as they will render (no gray,
 * real page components, entrance cascade as on the real screen).
 * Esc or "Back to editing" closes. Prototype: phone.src.html ~356-369.
 */
export function PreviewOverlay({ screen, onClose }) {
  const doneRef = useRef(null);

  useEffect(() => {
    doneRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="pv" role="dialog" aria-label="Preview">
      <div className="pv__bar">
        <span>Preview</span>
        <button type="button" ref={doneRef} onClick={onClose}>
          Back to editing
        </button>
      </div>
      <div className="pv__scroll">
        <main className="container main">
          {screen === "analytics" ? <AnalyticsPage /> : <DashboardPage />}
        </main>
      </div>
    </div>,
    document.body
  );
}
