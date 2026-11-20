import { ActiveWorkoutHero } from "../workout/ActiveWorkoutHero.jsx";
import { StartWorkoutHero } from "../workout/StartWorkoutHero.jsx";

/** "Start a workout": the live-workout hero while one runs, else the start hero. */
export function HomeStartSection({ activeSession, active, start }) {
  if (activeSession) {
    return (
      <ActiveWorkoutHero
        session={activeSession}
        nowMs={active.nowMs}
        onResume={active.onResume}
        setsProgress={active.setsProgress}
        onDiscarded={active.onDiscarded}
      />
    );
  }
  return (
    <StartWorkoutHero
      onStartEmpty={start.onStartEmpty}
      onBrowseTemplates={start.onBrowseTemplates}
      startingEmpty={start.startingEmpty}
      saved={start.saved}
      lastSessionLabel={start.lastSessionLabel}
    />
  );
}
