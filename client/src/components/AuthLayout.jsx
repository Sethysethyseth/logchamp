import { useLayoutEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import "./motion/crown-play.css";
import { takeLoaderCrown } from "./motion/crownIntroStore.js";
import wordmarkWhite from "../assets/brand/wordmark_white.png";

/* The crown inside the 1024 x 231 wordmark art: centre and width. */
const CROWN_CX = 488 / 1024;
const CROWN_CY = 41 / 231;
const CROWN_W = 100 / 1024;

export function AuthLayout() {
  const markRef = useRef(null);
  const [from] = useState(takeLoaderCrown);
  const handoff = Boolean(from);

  /* Arriving straight from the full-page wait: the big spinning crown does
     not vanish - this screen's crown starts where it was and shrinks home. */
  useLayoutEffect(() => {
    const mark = markRef.current;
    if (!from || !mark) return;
    const r = mark.getBoundingClientRect();
    if (!r.width) return;
    mark.style.setProperty("--crown-dx", `${from.x - (r.left + r.width * CROWN_CX)}px`);
    mark.style.setProperty("--crown-dy", `${from.y - (r.top + r.height * CROWN_CY)}px`);
    mark.style.setProperty("--crown-scale", String(from.w / (r.width * CROWN_W)));
  }, [from]);

  return (
    <div className="auth-page auth-shell">
      <div className="auth-card-wrap">
        <div className={`wordmark${handoff ? " wordmark--handoff" : ""}`} ref={markRef}>
          <img src={wordmarkWhite} alt="LogChamp" />
          {handoff ? (
            <span className="wordmark__sparks" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>
        <p className="muted small auth-tagline">Log your shit dog</p>
        <Outlet />
      </div>
    </div>
  );
}
