import { WeeklyDigest, weeklyDigest, weeklyFacts } from "../analytics/WeeklyReport.jsx";
import { HomeSectionCard } from "./HomeSectionCard.jsx";

/** "Highlights": PR rows, Movers, Execution and Note lines for the last 7 days. */
export function HomeHighlightsSection({ report }) {
  if (report.status !== "ready") return null;
  const facts = weeklyFacts(report.current, report.prior);
  if (!facts.currentHasData) return null;

  const digest = weeklyDigest(report.current, report.prior, facts.priorEmpty);
  if (!digest) return null;

  return (
    <HomeSectionCard id="highlights" title="Highlights" aside="last 7 days">
      <WeeklyDigest digest={digest} />
    </HomeSectionCard>
  );
}
