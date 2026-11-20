import { UpNextCard } from "../blocks/run/UpNextCard.jsx";

/**
 * "Next in your block". `mode` comes from DashboardPage's guards:
 * "card" - the bold card (run active, no live workout); "placeholder" - the
 * same-height slot while the run fetch is pending; "muted" - "Up next after
 * this" during a live workout; null - nothing.
 */
export function HomeUpNextSection({ mode, activeBlock, starting = false, onStart, liveDay = null }) {
  if (mode === "card") {
    return (
      <UpNextCard
        block={activeBlock.block}
        progress={activeBlock.progress}
        runId={activeBlock.run.id}
        starting={starting}
        onStart={onStart}
      />
    );
  }
  if (mode === "placeholder") {
    return (
      <section
        className="card bk-up-next bk-up-next--placeholder skeleton__block"
        aria-hidden="true"
      />
    );
  }
  if (mode === "muted") {
    return (
      <UpNextCard
        block={activeBlock.block}
        progress={activeBlock.progress}
        runId={activeBlock.run.id}
        mutedOnly
        liveDay={liveDay}
      />
    );
  }
  return null;
}
