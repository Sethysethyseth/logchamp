import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./crown-play.css";

const RAIN_TAPS = 5;
const RAIN_WINDOW_MS = 2000;
const RAIN_MS = 3200;

function makeDrops() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.round(Math.random() * 96),
    size: 12 + Math.round(Math.random() * 3) * 6,
    fall: 1200 + Math.round(Math.random() * 1100),
    delay: Math.round(Math.random() * 900),
  }));
}

/**
 * The Home masthead crown, as a quiet easter egg (MX). A tap flips it like
 * an 8-bit coin; five quick taps make it rain crowns. Pure decoration: it
 * stays out of the tab order and the accessibility tree, like the plain
 * crown it replaces. Reduced motion: the CSS does nothing, taps are inert.
 */
export function CrownEgg() {
  const [flip, setFlip] = useState(0);
  const [rain, setRain] = useState(null);
  const taps = useRef([]);

  useEffect(() => {
    if (!rain) return undefined;
    const timer = setTimeout(() => setRain(null), RAIN_MS);
    return () => clearTimeout(timer);
  }, [rain]);

  function onTap() {
    setFlip((n) => n + 1);
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < RAIN_WINDOW_MS), now];
    if (taps.current.length >= RAIN_TAPS) {
      taps.current = [];
      setRain({ id: now, drops: makeDrops() });
      try {
        navigator.vibrate?.(24);
      } catch {
        /* no haptics here - fine */
      }
    }
  }

  return (
    <>
      <button type="button" className="crown-egg" tabIndex={-1} aria-hidden="true" onClick={onTap}>
        <span
          key={flip}
          className={`home-masthead__crown${flip ? " crown-egg__flip" : ""}`}
        />
        {flip ? (
          <span className="crown-sparks" key={`s${flip}`}>
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : null}
      </button>
      {rain
        ? createPortal(
            <div className="crown-rain" key={rain.id} aria-hidden="true">
              {rain.drops.map((d) => (
                <span
                  key={d.id}
                  className="home-masthead__crown crown-rain__drop"
                  style={{
                    left: `${d.x}%`,
                    width: d.size,
                    height: d.size,
                    animationDuration: `${d.fall}ms`,
                    animationDelay: `${d.delay}ms`,
                  }}
                />
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
