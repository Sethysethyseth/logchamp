import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as blockRunApi from "../../../api/blockRunApi.js";
import { useWeeklyReport, weeklyReportWindows } from "../../analytics/WeeklyReport.jsx";
import {
  HomeBeatSection,
  HomeDueSection,
  HomeHighlightsSection,
  HomeRecentSection,
  HomeStartSection,
  HomeUpNextSection,
  HomeWeekSection,
} from "../../home/index.js";
import { WeekStrip } from "../../workout/WeekStrip.jsx";
import { isRunFinished } from "../../blocks/run/dayStatusTiles.js";
import { countWorkoutVolume } from "../../blocks/run/runExerciseHelpers.js";
import { useActiveSession } from "../../../context/ActiveSessionContext.jsx";
import { HOME_SECTIONS } from "../../../lib/screenLayout.js";
import { setHomeLayout } from "../../../lib/layoutPref.js";
import { blockDayPrimaryTitle, sessionDisplayTitle } from "../../../lib/sessionDisplay.js";
import { loadWeightUnit } from "../../../lib/weightUnitPref.js";
import { SectionMod } from "./SectionMod.jsx";
import { SortableList } from "./SortableList.jsx";

function countLoggedSetsFromListSession(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  return sets.filter((s) => {
    const reps = s?.reps;
    return reps != null && String(reps).trim() !== "";
  }).length;
}

function formatRelativeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label]));
const LOCKED = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, Boolean(s.locked)]));
const NOTE = { upnext: "only while a block runs", highlights: "PRs, movers, execution" };

/**
 * Customize canvas for Home: real section components, pointer-events off
 * on bodies. Up next only when a block runs (or placeholder while loading).
 */
export function HomeCustomizeCanvas({ home }) {
  const navigate = useNavigate();
  const { sessions, activeSession, loading: sessionsLoading } = useActiveSession();
  const weeklyReport = useWeeklyReport(0);
  const reportWindows = useMemo(() => weeklyReportWindows(), []);
  const [activeBlock, setActiveBlock] = useState(null);
  const [activeBlockReady, setActiveBlockReady] = useState(false);
  const heroNow = useMemo(() => Date.now(), []);

  useEffect(() => {
    let cancelled = false;
    setActiveBlockReady(false);
    (async () => {
      try {
        const data = await blockRunApi.getActiveBlockRun();
        if (cancelled) return;
        if (data?.run && data.block && data.progress && !isRunFinished(data.progress)) {
          setActiveBlock({ run: data.run, block: data.block, progress: data.progress });
        } else {
          setActiveBlock(null);
        }
      } catch {
        if (!cancelled) setActiveBlock(null);
      } finally {
        if (!cancelled) setActiveBlockReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSession?.id]);

  const completedRecent = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions.filter((s) => s?.completedAt) : [];
    list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return list.slice(0, 5);
  }, [sessions]);

  const hasActive = Boolean(activeSession);
  const liveBlockDay = useMemo(() => {
    if (!activeSession) return null;
    const weekOrder = activeSession.blockContext?.weekOrder ?? activeSession.blockWeekOrder;
    const workoutOrder =
      activeSession.blockContext?.workoutOrder ?? activeSession.blockWorkoutOrder;
    if (weekOrder == null || workoutOrder == null) return null;
    return { weekOrder: Number(weekOrder), workoutOrder: Number(workoutOrder) };
  }, [activeSession]);

  const showBlockCard = Boolean(
    !hasActive &&
      activeBlockReady &&
      activeBlock?.block &&
      activeBlock.progress?.nextDay &&
      (activeBlock.progress.weeks || [])
        .find((w) => w.order === activeBlock.progress.nextDay.weekOrder)
        ?.days?.some((d) => d.order === activeBlock.progress.nextDay.workoutOrder)
  );

  const upNextMode = showBlockCard
    ? "card"
    : hasActive && activeBlockReady && activeBlock
      ? "muted"
      : null;

  const liveSetsProgress = useMemo(() => {
    if (!activeSession || blockDayPrimaryTitle(activeSession) == null) return null;
    if (!liveBlockDay || !activeBlock?.block) return null;
    const blockWeek = (activeBlock.block.weeks || []).find(
      (w) => Number(w.order) === liveBlockDay.weekOrder
    );
    const workout = (blockWeek?.workouts || []).find(
      (w) => Number(w.order) === liveBlockDay.workoutOrder
    );
    if (!workout) return null;
    const { sets: planned } = countWorkoutVolume(workout);
    if (!planned || planned <= 0) return null;
    return {
      planned,
      logged: countLoggedSetsFromListSession(activeSession),
    };
  }, [activeSession, activeBlock, liveBlockDay]);

  const unit = loadWeightUnit();
  const showDayStrip = !showBlockCard;

  function renderBody(id) {
    switch (id) {
      case "start":
        return (
          <HomeStartSection
            activeSession={activeSession}
            active={{
              nowMs: heroNow,
              onResume: () => navigate(`/sessions/${activeSession?.id}`),
              setsProgress: liveSetsProgress,
              onDiscarded: () => {},
            }}
            start={{
              onStartEmpty: () => {},
              onBrowseTemplates: () => {},
              startingEmpty: false,
              saved: null,
              lastSessionLabel: completedRecent[0]
                ? `${sessionDisplayTitle(completedRecent[0])}, ${formatRelativeDay(completedRecent[0].completedAt)}`
                : null,
            }}
          />
        );
      case "upnext":
        return upNextMode ? (
          <HomeUpNextSection
            mode={upNextMode}
            activeBlock={activeBlock}
            starting={false}
            onStart={() => {}}
            liveDay={liveBlockDay}
          />
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Shows only while a block runs.
          </p>
        );
      case "week":
        return (
          <HomeWeekSection
            report={weeklyReport}
            weekStrip={
              showDayStrip ? (
                <WeekStrip
                  sessions={sessions}
                  from={reportWindows.current.from}
                  to={reportWindows.current.to}
                />
              ) : null
            }
          />
        );
      case "beat":
        return <HomeBeatSection reloadKey={0} />;
      case "due":
        return <HomeDueSection reloadKey={0} />;
      case "highlights":
        return <HomeHighlightsSection report={weeklyReport} />;
      case "recent":
        return (
          <HomeRecentSection sessions={completedRecent} loading={sessionsLoading} unit={unit} />
        );
      default:
        return null;
    }
  }

  const ids = home.map((r) => r.id);
  const byId = Object.fromEntries(home.map((r) => [r.id, r]));

  return (
    <SortableList
      listKey="home"
      ids={ids}
      onReorder={(order) => {
        setHomeLayout(order.map((id) => ({ id, on: byId[id]?.on !== false })));
      }}
    >
      {ids.map((id) => (
        <SectionMod
          key={id}
          id={id}
          name={LABEL[id] || id}
          note={NOTE[id]}
          on={byId[id]?.on !== false}
          locked={LOCKED[id]}
          onToggle={(nextOn) => {
            setHomeLayout(home.map((r) => (r.id === id ? { ...r, on: nextOn } : r)));
          }}
        >
          {renderBody(id)}
        </SectionMod>
      ))}
    </SortableList>
  );
}
