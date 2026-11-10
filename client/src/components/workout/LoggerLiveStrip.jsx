import { useEffect, useState } from "react";

function startMs(startedAt) {
  const t = startedAt ? new Date(startedAt).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
}

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/* The clock owns its own tick so the logger page never re-renders for it. */
function Elapsed({ from }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="logger-live__clock">{clock(now - from)}</span>;
}

/**
 * The live logger's status line: a square live pixel, the running clock and
 * the set count. Nothing here loops - the pixel pings and the count pops
 * once each time a set lands, so the header answers the floor.
 *
 * `reopened`: a finished workout being edited has no meaningful clock.
 */
export function LoggerLiveStrip({ startedAt, setsLogged = 0, setsPlanned = null, reopened = false, source = null }) {
  const from = reopened ? null : startMs(startedAt);
  /* Bump on a count that went UP since the last render (not on first paint,
     not on a delete) - the keyed nodes below remount and replay once. */
  const [seen, setSeen] = useState(setsLogged);
  const [bump, setBump] = useState(0);
  if (setsLogged !== seen) {
    setSeen(setsLogged);
    if (setsLogged > seen) setBump(bump + 1);
  }

  const count = setsPlanned ? `${setsLogged}/${setsPlanned}` : String(setsLogged);
  const noun = !setsPlanned && setsLogged === 1 ? "set" : "sets";

  return (
    <p className="logger-live" aria-label={`${reopened ? "Editing" : "Live"}, ${count} ${noun} logged`}>
      <span className="logger-live__state">
        <span key={bump} className={`logger-live__dot${bump ? " is-ping" : ""}`} aria-hidden="true" />
        {reopened ? "Editing" : "Live"}
      </span>
      {from != null ? <Elapsed from={from} /> : null}
      <span className="logger-live__sets">
        <b key={bump} className={`logger-live__count${bump ? " is-pop" : ""}`}>
          {count}
        </b>{" "}
        {noun}
      </span>
      {source ? <span className="logger-live__source">{source}</span> : null}
    </p>
  );
}
