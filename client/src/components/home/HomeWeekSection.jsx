import {
  ReportStat,
  deltaTone,
  formatCountDelta,
  readWeeklyMode,
  weeklyFacts,
  writeWeeklyMode,
} from "../analytics/WeeklyReport.jsx";
import { HomeSectionCard } from "./HomeSectionCard.jsx";

/** "This week": week strip, Workouts and PRs. `report` is useWeeklyReport's state. */
export function HomeWeekSection({ report, weekStrip = null }) {
  if (report.status === "loading") {
    const withStrip = Boolean(weekStrip);
    const compact = readWeeklyMode() === "compact";
    return (
      <section
        className={
          "card weekly-report weekly-report--skel" +
          (withStrip ? " weekly-report--skel-with-strip" : " weekly-report--skel-no-strip") +
          (compact ? " weekly-report--skel-compact" : "")
        }
        aria-busy="true"
        aria-label="Loading this week"
      >
        <div className="skeleton weekly-report__skel">
          <div className="skeleton__title" />
          {withStrip ? <div className="weekly-report__skel-strip" aria-hidden="true" /> : null}
          {compact ? (
            <div className="skeleton__block skeleton__block--short" />
          ) : (
            <div className="skeleton__tiles home-section__skel-pair">
              <div className="skeleton__tile" />
              <div className="skeleton__tile" />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (report.status !== "ready") return null;

  const facts = weeklyFacts(report.current, report.prior);
  if (!facts.currentHasData && !facts.priorHasData) return null;

  if (!facts.currentHasData) {
    writeWeeklyMode("compact");
    return (
      <HomeSectionCard id="week" title="This week" aside="Analytics →" linkTo="/analytics">
        {weekStrip ? <div className="weekly-report__strip">{weekStrip}</div> : null}
        <p className="weekly-report__nudge muted small">
          No workouts yet in the last 7 days. The 7 days before, you logged {facts.priorWorkouts}{" "}
          {facts.priorWorkouts === 1 ? "workout" : "workouts"}.
        </p>
      </HomeSectionCard>
    );
  }

  writeWeeklyMode("full");

  return (
    <HomeSectionCard id="week" title="This week" aside="Analytics →" linkTo="/analytics">
      {weekStrip ? <div className="weekly-report__strip">{weekStrip}</div> : null}
      <div className="weekly-report__stats home-section__stat-pair">
        <ReportStat
          label="Workouts"
          value={String(facts.currentWorkouts)}
          delta={formatCountDelta(facts.currentWorkouts, facts.priorWorkouts, facts.priorEmpty)}
          deltaTone={deltaTone(facts.currentWorkouts - facts.priorWorkouts, facts.priorEmpty)}
        />
        <ReportStat label="PRs" value={String(facts.prCount)} delta="this week" deltaTone={null} />
      </div>
    </HomeSectionCard>
  );
}
