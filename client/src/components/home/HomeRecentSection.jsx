import { Link } from "react-router-dom";
import { LoadingState } from "../LoadingState.jsx";
import { sessionDisplayBlockName, sessionDisplayTitle } from "../../lib/sessionDisplay.js";
import { formatTonnage, sessionDurationLabel, sessionTonnage } from "../../lib/sessionFacts.js";

function formatLoggedWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Recent workouts": the last five completed sessions. */
export function HomeRecentSection({ sessions, loading, unit }) {
  return (
    <section className="workout-tab-recent" aria-labelledby="workout-recent-heading">
      <div className="row workout-tab-recent__head">
        <h2 id="workout-recent-heading" className="workout-tab-recent__title">
          Recent workouts
        </h2>
        <Link className="workout-tab-recent__view-all" to="/sessions">
          View all → History
        </Link>
      </div>
      {loading && sessions.length === 0 ? (
        <LoadingState
          tone="skeleton"
          variant="list"
          rows={3}
          caption={false}
          label="Loading recent workouts…"
        />
      ) : sessions.length === 0 ? (
        <p className="muted small workout-tab-recent__empty" style={{ margin: 0 }}>
          Completed workouts show up here.
        </p>
      ) : (
        <div className="card recent-list">
          {sessions.map((s) => {
            const when = formatLoggedWhen(s.completedAt);
            const title = sessionDisplayTitle(s);
            const blockName = sessionDisplayBlockName(s);
            const exercises = s._count?.sessionExercises ?? null;
            const sets = s._count?.sets ?? null;
            const duration = sessionDurationLabel(s);
            const tonnage = formatTonnage(sessionTonnage(s), unit);
            return (
              <Link key={s.id} to={`/sessions/${s.id}`} className="recent-row">
                <span className="recent-row__main">
                  <span className="recent-row__title">{title}</span>
                  {blockName ? (
                    <span className="recent-row__block muted small">{blockName}</span>
                  ) : null}
                  <span className="recent-row__when muted small">
                    {when}
                    {exercises != null ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        {exercises} {exercises === 1 ? "exercise" : "exercises"}
                      </>
                    ) : null}
                    {sets != null ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        {sets} {sets === 1 ? "set" : "sets"}
                      </>
                    ) : null}
                  </span>
                </span>
                <span className="recent-row__facts">
                  {tonnage ? <span className="recent-row__fact">{tonnage}</span> : null}
                  {duration ? <span className="recent-row__fact recent-row__fact--muted">{duration}</span> : null}
                </span>
                <span className="recent-row__chevron" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
