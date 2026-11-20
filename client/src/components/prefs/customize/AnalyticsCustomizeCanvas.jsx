import { useEffect, useMemo, useState } from "react";
import * as analyticsApi from "../../../api/analyticsApi.js";
import { StatTiles } from "../../analytics/StatTiles.jsx";
import { AnalyticsViewTabs } from "../../analytics/AnalyticsViewTabs.jsx";
import { ExercisesView } from "../../analytics/ExercisesView.jsx";
import { CoachPanel } from "../../coach/CoachPanel.jsx";
import {
  BalanceSection,
  DataQualitySection,
  ExecutionSection,
  PerExerciseSection,
  PerMuscleSection,
} from "../../../pages/AnalyticsPage.jsx";
import { localDayRange } from "../../../lib/dateRange.js";
import { toDateOnlyString } from "../../../lib/dateOnly.js";
import { loadAnalyticsWeeks } from "../../../lib/analyticsRangePref.js";
import { buildSuggestedQuestions } from "../../../lib/coachSuggestions.js";
import {
  ANALYTICS_TOP_SECTIONS,
  ANALYTICS_VIEW_KEYS,
  ANALYTICS_VIEW_SECTIONS,
  reorderAnalyticsList,
  setAnalyticsSectionOn,
} from "../../../lib/screenLayout.js";
import { setAnalyticsLayout } from "../../../lib/layoutPref.js";
import { SectionMod } from "./SectionMod.jsx";
import { SortableList } from "./SortableList.jsx";

function rangeForWeeks(weeks) {
  return localDayRange(weeks * 7);
}

function coachRangeForWeeks(weeks) {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (weeks * 7 - 1));
  return { from: toDateOnlyString(fromDate), to: toDateOnlyString(today) };
}

const TOP_LABEL = Object.fromEntries(ANALYTICS_TOP_SECTIONS.map((s) => [s.id, s.label]));
const CARD_META = {};
for (const key of ANALYTICS_VIEW_KEYS) {
  for (const s of ANALYTICS_VIEW_SECTIONS[key]) {
    CARD_META[s.id] = s;
  }
}

/**
 * Customize canvas for Analytics: top list + view tabs + per-view cards.
 * quality is one switch across every view it appears in.
 */
export function AnalyticsCustomizeCanvas({ analytics, aView, onViewChange }) {
  const weeks = loadAnalyticsWeeks();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { from, to } = rangeForWeeks(weeks);
        const data = await analyticsApi.getSummary({ from, to });
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  const coachRange = useMemo(() => coachRangeForWeeks(weeks), [weeks]);
  const coachSuggestions = useMemo(
    () => (summary ? buildSuggestedQuestions(summary, { view: aView }) : []),
    [summary, aView]
  );

  function renderTop(id) {
    if (!summary) {
      return <p className="muted small" style={{ margin: 0 }}>Loading…</p>;
    }
    if (id === "tiles") return <StatTiles summary={summary} />;
    if (id === "coach") {
      return (
        <CoachPanel
          mode="ask"
          range={coachRange}
          weeks={weeks}
          focus={{ type: "view", view: aView }}
          suggestions={coachSuggestions}
        />
      );
    }
    return null;
  }

  function renderCard(id) {
    if (!summary && id !== "explorer") {
      return <p className="muted small" style={{ margin: 0 }}>Loading…</p>;
    }
    switch (id) {
      case "volume":
        return (
          <PerMuscleSection
            perMuscle={summary?.perMuscle ?? []}
            granularity={summary?.meta?.seriesGranularity}
            effortCoverage={summary?.meta?.effortCoverage}
          />
        );
      case "balance":
        return <BalanceSection balance={summary?.balance} />;
      case "trends":
        return <PerExerciseSection perExercise={summary?.perExercise ?? []} />;
      case "explorer":
        return (
          <ExercisesView
            weeks={weeks}
            range={rangeForWeeks(weeks)}
            perExercise={summary?.perExercise ?? []}
            exerciseParam={null}
            onExerciseParamChange={() => {}}
          />
        );
      case "execution":
        return <ExecutionSection execution={summary?.execution ?? []} />;
      case "quality":
        return <DataQualitySection meta={summary?.meta} />;
      default:
        return null;
    }
  }

  const topIds = analytics.top.map((r) => r.id);
  const topById = Object.fromEntries(analytics.top.map((r) => [r.id, r]));
  const viewRows = analytics.views[aView] || [];
  const viewIds = viewRows.map((r) => r.id);
  const viewById = Object.fromEntries(viewRows.map((r) => [r.id, r]));

  return (
    <>
      <div className="cz-group">Top of the page</div>
      <SortableList
        listKey="atop"
        ids={topIds}
        onReorder={(order) => {
          setAnalyticsLayout(reorderAnalyticsList(analytics, "top", order));
        }}
      >
        {topIds.map((id) => (
          <SectionMod
            key={id}
            id={id}
            name={TOP_LABEL[id] || id}
            on={topById[id]?.on !== false}
            locked={false}
            onToggle={(nextOn) => {
              setAnalyticsLayout(setAnalyticsSectionOn(analytics, "top", id, nextOn));
            }}
          >
            {renderTop(id)}
          </SectionMod>
        ))}
      </SortableList>

      <div className="cz-group">Views · tap a tab to edit its cards</div>
      <AnalyticsViewTabs value={aView} onChange={onViewChange} />
      <SortableList
        listKey={`view:${aView}`}
        ids={viewIds}
        onReorder={(order) => {
          setAnalyticsLayout(reorderAnalyticsList(analytics, aView, order));
        }}
      >
        {viewIds.map((id) => {
          const meta = CARD_META[id];
          return (
            <SectionMod
              key={`${aView}-${id}`}
              id={id}
              name={meta?.label || id}
              note={meta?.shared ? "every view" : undefined}
              on={viewById[id]?.on !== false}
              locked={false}
              onToggle={(nextOn) => {
                setAnalyticsLayout(setAnalyticsSectionOn(analytics, aView, id, nextOn));
              }}
            >
              {renderCard(id)}
            </SectionMod>
          );
        })}
      </SortableList>
    </>
  );
}
