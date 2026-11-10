import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { REST_TIMER_EVENT, readRestRun } from "../../lib/restTimer.js";
import { SCENE_SIGNAL_EVENT } from "../../lib/sceneSignal.js";
import { sessionDisplayTitle } from "../../lib/sessionDisplay.js";
import { createArena } from "./arenaEngine.js";
import "./arena.css";

const DAY_MS = 86400000;

/* Route -> place in the arena, and how much of the screen the stage gets
   before the page (the sheet) starts. Light pages show more arena. */
function placeFor(pathname, activeId) {
  if (pathname === "/") return ["home", "46svh"];
  if (pathname.startsWith("/analytics")) return ["analytics", "38svh"];
  if (pathname.startsWith("/coach")) return ["coach", "22svh"];
  if (pathname.startsWith("/profile")) return ["profile", "28svh"];
  if (pathname.startsWith("/sessions/")) {
    const live = activeId != null && pathname === `/sessions/${activeId}`;
    return [live ? "home" : "history", "24svh"];
  }
  if (pathname.startsWith("/sessions")) return ["history", "34svh"];
  if (pathname.startsWith("/log-workout")) return ["home", "24svh"];
  return ["library", pathname === "/templates" ? "30svh" : "20svh"];
}

const setsOf = (session) => session?._count?.sets ?? (Array.isArray(session?.sets) ? session.sets.length : 0);
const doneAt = (session) => {
  const t = new Date(session?.completedAt || NaN).getTime();
  return Number.isNaN(t) ? null : t;
};

/** What the room shows from real training: the week, eight weeks of sets, one seat per workout. */
function roomFacts(sessions, now) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const bars = [0, 0, 0, 0, 0, 0, 0, 0];
  let weekSets = 0;
  let seats = 0;
  const midnight = new Date(now).setHours(24, 0, 0, 0);
  for (const session of sessions || []) {
    const at = doneAt(session);
    if (at == null) continue;
    seats += 1;
    const dayAgo = Math.floor((midnight - at) / DAY_MS);
    if (dayAgo >= 0 && dayAgo < 7) {
      days[6 - dayAgo] = 1;
      weekSets += setsOf(session);
    }
    const weekAgo = Math.floor(dayAgo / 7);
    if (weekAgo >= 0 && weekAgo < 8) bars[7 - weekAgo] += setsOf(session);
  }
  return { week: { days, sets: weekSets }, bars, seats };
}

/**
 * Arena view (beta). A fixed stage behind the top of every page; the page
 * itself is the sheet and scrolls up over it with the ordinary window
 * scroll, so nothing inside a page has to know the arena exists.
 */
export function ArenaStage() {
  const canvasRef = useRef(null);
  const arenaRef = useRef(null);
  const { pathname } = useLocation();
  const { sessions, activeSession } = useActiveSession();
  const activeId = activeSession?.id ?? null;
  const [place, height] = placeFor(pathname, activeId);

  useEffect(() => {
    const canvas = canvasRef.current;
    const arena = createArena(canvas);
    arenaRef.current = arena;
    arena.resize();
    const ro = new ResizeObserver(() => arena.resize());
    ro.observe(canvas);
    const mo = new MutationObserver(() => arena.recolor());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style"] });
    const onScroll = () => arena.set({ covered: window.scrollY > canvas.clientHeight });
    const onVisible = () => arena.set({});
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisible);
      arena.destroy();
      arenaRef.current = null;
    };
  }, []);

  // The stage's height belongs to the route; the page starts below it.
  useEffect(() => {
    document.documentElement.style.setProperty("--arena-h", height);
  }, [height]);
  useEffect(() => () => document.documentElement.style.removeProperty("--arena-h"), []);

  useEffect(() => {
    arenaRef.current?.set({ place });
  }, [place]);

  useEffect(() => {
    arenaRef.current?.set(roomFacts(sessions, Date.now()));
  }, [sessions]);

  const liveStart = activeSession ? new Date(activeSession.startedAt || activeSession.performedAt).getTime() : null;
  const liveSets = setsOf(activeSession);
  const lastTitle = useMemo(() => {
    const latest = (sessions || []).filter((x) => doneAt(x) != null).sort((a, b) => doneAt(b) - doneAt(a))[0];
    return latest ? sessionDisplayTitle(latest) : "";
  }, [sessions]);
  const lastTitleRef = useRef(lastTitle);
  useEffect(() => {
    lastTitleRef.current = lastTitle;
    arenaRef.current?.set({ savedName: lastTitle });
  }, [lastTitle]);

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return undefined;
    if (activeId == null || !Number.isFinite(liveStart)) {
      arena.set({ live: null, rest: null });
      return undefined;
    }
    let sets = liveSets;
    const push = () => arena.set({ live: { startedAtMs: liveStart, sets }, rest: readRestRun(activeId) });
    push();
    const onRest = () => push();
    const onSignal = (event) => {
      if (event?.detail?.kind !== "set") return;
      sets += 1;
      push();
      arena.flash(220);
    };
    window.addEventListener(REST_TIMER_EVENT, onRest);
    window.addEventListener(SCENE_SIGNAL_EVENT, onSignal);
    return () => {
      window.removeEventListener(REST_TIMER_EVENT, onRest);
      window.removeEventListener(SCENE_SIGNAL_EVENT, onSignal);
    };
  }, [activeId, liveStart, liveSets]);

  useEffect(() => {
    const onSignal = (event) => {
      const arena = arenaRef.current;
      const kind = event?.detail?.kind;
      if (!arena) return;
      if (kind === "finish") {
        arena.set({ savedUntil: Date.now() + 5000, savedName: lastTitleRef.current });
        arena.flash(2000);
      } else if (kind === "rest") {
        arena.flash(300);
      }
    };
    window.addEventListener(SCENE_SIGNAL_EVENT, onSignal);
    return () => window.removeEventListener(SCENE_SIGNAL_EVENT, onSignal);
  }, []);

  return (
    <div className="arena-stage" aria-hidden="true">
      <canvas ref={canvasRef} className="arena-stage__canvas" />
    </div>
  );
}
