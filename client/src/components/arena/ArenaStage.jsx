import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { loadAnalyticsWeeks } from "../../lib/analyticsRangePref.js";
import { ARENA_STRIP_SVH, arenaSize, stageRide, stripReveal } from "../../lib/arenaSheet.js";
import { setArenaTour, useArenaTour } from "../../lib/arenaTour.js";
import { REST_TIMER_EVENT, readRestRun } from "../../lib/restTimer.js";
import { SCENE_SIGNAL_EVENT } from "../../lib/sceneSignal.js";
import { sessionDisplayTitle } from "../../lib/sessionDisplay.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import { CHEER_MS, createArena } from "./arenaEngine.js";
import "./arena.css";

const DAY_MS = 86400000;
/* Matches the stage's 440ms size change in arena.css. */
const SETTLE_MS = 460;

/* Route -> place in the arena (where the camera stands), and what the strip reads. */
function placeFor(pathname, activeId) {
  if (pathname === "/") return ["home", "home"];
  if (pathname.startsWith("/analytics")) return ["analytics", "analytics"];
  if (pathname.startsWith("/coach")) return ["coach", "coach"];
  if (pathname.startsWith("/profile")) return ["profile", null];
  if (pathname.startsWith("/sessions/")) {
    const live = activeId != null && pathname === `/sessions/${activeId}`;
    return live ? ["home", null] : ["history", "history"];
  }
  if (pathname.startsWith("/sessions")) return ["history", "history"];
  if (pathname.startsWith("/log-workout")) return ["home", null];
  return ["library", null];
}

const setsOf = (session) => session?._count?.sets ?? (Array.isArray(session?.sets) ? session.sets.length : 0);
const doneAt = (session) => {
  const t = new Date(session?.completedAt || NaN).getTime();
  return Number.isNaN(t) ? null : t;
};

/* The next local midnight - the week's edge. A store, so render stays pure; it checks once a minute. */
const nextMidnight = () => new Date().setHours(24, 0, 0, 0);
function subscribeDay(onChange) {
  const id = window.setInterval(onChange, 60000);
  return () => window.clearInterval(id);
}
function subscribeStorage(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** What the room shows from real training: the week, eight weeks of sets, one seat per workout. */
function roomFacts(sessions, midnight) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const bars = [0, 0, 0, 0, 0, 0, 0, 0];
  let weekSets = 0;
  let weekWorkouts = 0;
  let seats = 0;
  for (const session of sessions || []) {
    const at = doneAt(session);
    if (at == null) continue;
    seats += 1;
    const dayAgo = Math.floor((midnight - at) / DAY_MS);
    if (dayAgo >= 0 && dayAgo < 7) {
      days[6 - dayAgo] = 1;
      weekSets += setsOf(session);
      weekWorkouts += 1;
    }
    const weekAgo = Math.floor(dayAgo / 7);
    if (weekAgo >= 0 && weekAgo < 8) bars[7 - weekAgo] += setsOf(session);
  }
  return { week: { days, sets: weekSets, workouts: weekWorkouts }, bars, seats };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** The one line the full view keeps on screen, per place, from the same facts as the strip. */
function peekLine(place, facts, live, weeks) {
  if (live && place === "home") return `In progress · ${plural(live.sets, "set", "sets")} logged`;
  if (place === "home") {
    return `Last 7 days: ${plural(facts.week.workouts, "workout", "workouts")} · ${plural(facts.week.sets, "set", "sets")}`;
  }
  if (place === "analytics") {
    const n = Math.min(weeks, facts.bars.length);
    return `Last ${n} weeks: ${plural(facts.bars.slice(-n).reduce((a, b) => a + b, 0), "set", "sets")}`;
  }
  if (place === "history") return `${plural(facts.seats, "workout", "workouts")} · one lit seat each`;
  if (place === "coach") return "Ask the coach anything";
  if (place === "library") return "Your workouts and blocks";
  return `${plural(facts.seats, "workout", "workouts")} logged`;
}

/* The strip's opacity follows the scroll exactly. A route's size change
   fades it in place instead (route = true); it never slides. */
function applyStrip(st, route) {
  const { geom, strip } = st;
  const ride = stageRide({ scrollY: window.scrollY, openPx: geom.openPx, stripPx: geom.stripPx });
  const reveal = stripReveal({ ride, openPx: geom.openPx, stripPx: geom.stripPx });
  const reduced = prefersReducedMotion();
  if (reveal !== geom.reveal) {
    if (route && !reduced) strip.dataset.fade = reveal > geom.reveal ? "in" : "out";
    else delete strip.dataset.fade;
    geom.reveal = reveal;
    strip.style.opacity = String(reduced ? (reveal >= 1 ? 1 : 0) : reveal);
    strip.classList.toggle("arena-strip--full", reveal >= 1);
  }
  const showStrip = reveal > 0;
  const covered = reveal >= 1;
  window.clearTimeout(st.coverTimer);
  const push = (patch) => {
    Object.assign(geom, patch);
    st.arena.set(patch);
  };
  if (showStrip !== geom.strip) push({ strip: showStrip });
  if (covered !== geom.covered) {
    // A route shrinking to the strip keeps drawing the room until the stage has settled.
    if (covered && route && !reduced) st.coverTimer = window.setTimeout(() => push({ covered: true }), SETTLE_MS);
    else push({ covered });
  }
}

/* Target sizes in px, read only on a route change or a resize - never per scroll. */
function measureStage(st) {
  const root = document.documentElement.style;
  root.setProperty("--arena-strip-h", `${ARENA_STRIP_SVH}svh`);
  st.geom.openPx = st.probe.offsetHeight || 0;
  st.geom.stripPx = st.stripProbe.offsetHeight || 0;
  const nav = document.querySelector(".app > .nav");
  const top = nav && getComputedStyle(nav).display !== "none" ? nav.offsetHeight : 0;
  root.setProperty("--arena-top", `${top}px`);
}

const HOLD_MS = 480;
/* Css px a press may wander and still count as a tap or a hold. */
const TAP_PX = 10;

/* Look closer. Hold or pinch out to zoom in where you pressed (it turns the
   full view on first); drag to look around; a tap steps back, unless it
   lands on the Log; pinch in steps back. A tap at 1x is left to the button's
   click, which toggles the full view. Returns the cleanup. */
function bindLook(st, stage, canvas) {
  const ptrs = new Map();
  let press = null;
  let pinch = null;
  let hold = 0;
  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    return st.arena.toWorld((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const zoomIn = (point) => {
    setArenaTour(true);
    st.look(point);
  };
  const down = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    ptrs.set(e.pointerId, e);
    window.clearTimeout(hold);
    if (ptrs.size === 1) st.swallow = false;
    if (ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      pinch = pinch || { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, done: false };
      press = null;
      st.swallow = true;
      return;
    }
    press = { x0: e.clientX, y0: e.clientY, from: st.arena.focus(), moved: 0, dead: false, point: at(e) };
    if (st.arena.zoomed()) {
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      return;
    }
    hold = window.setTimeout(() => {
      if (!press || press.moved >= TAP_PX) return;
      press.dead = true;
      st.swallow = true;
      zoomIn(press.point);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* no haptics here - fine */
      }
    }, HOLD_MS);
  };
  const move = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, e);
    if (pinch) {
      if (ptrs.size < 2 || pinch.done) return;
      const [a, b] = [...ptrs.values()];
      const k = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d0;
      if (k > 1.3 && !st.arena.zoomed()) {
        pinch.done = true;
        zoomIn(at({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }));
      } else if (k < 0.77 && st.arena.zoomed()) {
        pinch.done = true;
        st.back();
      }
      return;
    }
    if (!press) return;
    const dx = e.clientX - press.x0;
    const dy = e.clientY - press.y0;
    press.moved = Math.max(press.moved, Math.hypot(dx, dy));
    if (press.dead || !st.arena.zoomed()) return;
    const r = canvas.getBoundingClientRect();
    st.arena.pan(press.from, dx / r.width, dy / r.height);
  };
  const up = (e) => {
    const had = ptrs.delete(e.pointerId);
    window.clearTimeout(hold);
    if (pinch) {
      if (ptrs.size === 0) pinch = null;
      press = null;
      return;
    }
    const p = press;
    press = null;
    if (!had || !p || p.dead || !st.arena.zoomed()) return;
    // Up close a tap never toggles the full view: the Log answers it, anything else steps back.
    st.swallow = true;
    if (e.type === "pointerup" && p.moved < TAP_PX) {
      if (st.arena.tapLog(p.point)) st.onCheer();
      else st.back();
    }
  };
  const block = (e) => e.preventDefault();
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("contextmenu", block);
  stage.addEventListener("selectstart", block);
  return () => {
    window.clearTimeout(hold);
    stage.removeEventListener("pointerdown", down);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerup", up);
    stage.removeEventListener("pointercancel", up);
    stage.removeEventListener("contextmenu", block);
    stage.removeEventListener("selectstart", block);
  };
}

/**
 * Arena view (beta). The stage sits in the page flow above the sheet and
 * moves with the sheet's top edge as one piece: the window scroll carries
 * both, and `position: sticky` holds the stage at strip height. A route's
 * size change grows or shrinks the spacer the stage is anchored to, so the
 * room can never move against the sheet's edge. The camera only walks
 * sideways. Nothing inside a page has to know the arena exists.
 */
export function ArenaStage() {
  const canvasRef = useRef(null);
  const stageBtnRef = useRef(null);
  const stripRef = useRef(null);
  const probeRef = useRef(null);
  const stripProbeRef = useRef(null);
  const arenaRef = useRef(null);
  const stageRef = useRef(null);
  const { pathname } = useLocation();
  const tour = useArenaTour();
  const { sessions, activeSession } = useActiveSession();
  const activeId = activeSession?.id ?? null;
  const [place, facet] = placeFor(pathname, activeId);
  const size = arenaSize({ pathname, tour, live: activeId != null });
  const [cheer, setCheer] = useState(false);
  const cheerTimer = useRef(0);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const arena = createArena(canvas, stripRef.current);
    const st = {
      arena,
      strip: stripRef.current,
      probe: probeRef.current,
      stripProbe: stripProbeRef.current,
      geom: { openPx: 0, stripPx: 0, reveal: -1, covered: false, strip: false },
      coverTimer: 0,
      swallow: false, // the next click belongs to a closer-look gesture, not the full-view toggle
    };
    const stage = stageBtnRef.current;
    st.look = (point) => {
      arena.look(point);
      stage.dataset.zoom = "";
    };
    st.back = () => {
      arena.back();
      delete stage.dataset.zoom;
    };
    // Zoomed in on the Log the scoreboard is off screen: the line carries the cheer.
    st.onCheer = () => {
      window.clearTimeout(cheerTimer.current);
      setCheer(true);
      cheerTimer.current = window.setTimeout(() => setCheer(false), CHEER_MS);
    };
    arenaRef.current = arena;
    stageRef.current = st;
    const unbindLook = bindLook(st, stage, canvas);
    arena.resize();
    const ro = new ResizeObserver(() => {
      arena.resize();
      measureStage(st);
      applyStrip(st, false);
    });
    ro.observe(canvas);
    // The navbar renders only once auth settles; its height sets --arena-top on desktop.
    let nav = null;
    const watchNav = () => {
      const next = document.querySelector(".app > .nav");
      if (next === nav) return;
      if (nav) ro.unobserve(nav);
      nav = next;
      if (nav) ro.observe(nav);
      else measureStage(st);
    };
    watchNav();
    const app = canvas.closest(".app");
    const navMo = new MutationObserver(watchNav);
    if (app) navMo.observe(app, { childList: true });
    const mo = new MutationObserver(() => arena.recolor());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style"] });
    const onScroll = () => applyStrip(st, false);
    const onVisible = () => arena.set({});
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unbindLook();
      ro.disconnect();
      navMo.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(st.coverTimer);
      window.clearTimeout(cheerTimer.current);
      arena.destroy();
      arenaRef.current = null;
      stageRef.current = null;
    };
  }, []);

  /* The stage's height belongs to the route (or the full view); the sheet starts below it. */
  const height =
    size.mode === "tour" ? `calc(${size.svh}svh - var(--arena-tour-gap) - var(--arena-top))` : `${size.svh}svh`;
  useLayoutEffect(() => {
    const st = stageRef.current;
    document.documentElement.style.setProperty("--arena-h", height);
    if (!st) return;
    measureStage(st);
    applyStrip(st, true);
  }, [height]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--arena-h");
      document.documentElement.style.removeProperty("--arena-top");
      document.documentElement.style.removeProperty("--arena-strip-h");
    },
    []
  );

  useEffect(() => {
    arenaRef.current?.set({ place, facet });
  }, [place, facet]);

  /* A closer look ends with the full view, and on any change of tab. */
  useEffect(() => {
    stageRef.current?.back();
  }, [pathname]);
  useEffect(() => {
    if (!tour) stageRef.current?.back();
  }, [tour]);

  const midnight = useSyncExternalStore(subscribeDay, nextMidnight, nextMidnight);
  const facts = useMemo(() => roomFacts(sessions, midnight), [sessions, midnight]);
  useEffect(() => {
    arenaRef.current?.set(facts);
  }, [facts]);

  /* Analytics follows the page's range: read on every render (so on entering it) and when another tab changes it. */
  const weeks = useSyncExternalStore(subscribeStorage, loadAnalyticsWeeks, loadAnalyticsWeeks);
  useEffect(() => {
    arenaRef.current?.set({ weeks });
  }, [weeks]);

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
      } else if (kind === "rain") {
        // The crowns start at the top of what is on screen, below the desktop navbar.
        const r = canvasRef.current?.getBoundingClientRect();
        const top = parseFloat(document.documentElement.style.getPropertyValue("--arena-top")) || 0;
        arena.rain(r && r.height ? (top - r.top) / r.height : 0);
      } else if (kind === "lift") {
        arena.hold(true);
      } else if (kind === "drop") {
        arena.hold(false);
      }
    };
    window.addEventListener(SCENE_SIGNAL_EVENT, onSignal);
    return () => window.removeEventListener(SCENE_SIGNAL_EVENT, onSignal);
  }, []);

  const live = activeId != null ? { sets: liveSets } : null;

  return (
    <>
      <div className="arena-spacer">
        <button
          ref={stageBtnRef}
          type="button"
          className="arena-stage"
          aria-label="Full view of the arena"
          aria-pressed={tour}
          onClick={(e) => {
            const st = stageRef.current;
            // A keyboard click (detail 0) always toggles.
            if (st?.swallow && e.detail !== 0) {
              st.swallow = false;
              return;
            }
            setArenaTour(!tour);
          }}
        >
          <canvas ref={canvasRef} className="arena-stage__canvas" aria-hidden="true" />
        </button>
        <span ref={probeRef} className="arena-probe" aria-hidden="true" />
        <span ref={stripProbeRef} className="arena-probe arena-probe--strip" aria-hidden="true" />
      </div>
      <canvas ref={stripRef} className="arena-strip" aria-hidden="true" onClick={() => setArenaTour(true)} />
      {tour ? (
        <button type="button" className="arena-peek" onClick={() => setArenaTour(false)}>
          {cheer ? "LOG CHAMP" : peekLine(place, facts, live, weeks)}
        </button>
      ) : null}
    </>
  );
}
