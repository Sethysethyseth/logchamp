import { useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import { useArenaView } from "../lib/arenaPref.js";
import { useArenaTour } from "../lib/arenaTour.js";
import { ArenaStage } from "./arena/ArenaStage.jsx";
import { CoachWorkingBar } from "./coach/CoachWorkingBar.jsx";
import { BottomNav } from "./layout/BottomNav.jsx";
import { Navbar } from "./layout/Navbar.jsx";
import { PersistentWorkoutBar } from "./workout/PersistentWorkoutBar.jsx";
import { WhatsNewGate } from "./whatsnew/WhatsNewGate.jsx";

export function Layout() {
  /* Arena view (Appearance; the default look): the stage sits above the top
     of every page and the page becomes the sheet. Classic = the earlier
     layout, untouched. A layout effect, so the first paint already carries
     data-arena (no frame of unskinned sheet on a cold open). */
  const arena = useArenaView();
  const tour = useArenaTour();
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-arena", arena);
    return () => document.documentElement.removeAttribute("data-arena");
  }, [arena]);

  const page = (
    <>
      <CoachWorkingBar />
      <div className="persistent-workout-bar-wrap container">
        <PersistentWorkoutBar />
      </div>
      <main className="container main">
        <Outlet />
      </main>
    </>
  );

  /* The full view puts the page away (hidden, inert) and keeps the nav;
     the page stays mounted, so its state survives the trip. */
  return (
    <div className="app">
      <Navbar />
      {arena ? <ArenaStage /> : null}
      {arena ? (
        <div className={`arena-sheet${tour ? " arena-sheet--tour" : ""}`}>
          <div className="arena-sheet__page" hidden={tour} inert={tour}>
            {page}
          </div>
        </div>
      ) : (
        page
      )}
      <BottomNav />
      <WhatsNewGate />
    </div>
  );
}
