import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useArenaView } from "../lib/arenaPref.js";
import { ArenaStage } from "./arena/ArenaStage.jsx";
import { CoachWorkingBar } from "./coach/CoachWorkingBar.jsx";
import { BottomNav } from "./layout/BottomNav.jsx";
import { Navbar } from "./layout/Navbar.jsx";
import { PersistentWorkoutBar } from "./workout/PersistentWorkoutBar.jsx";
import { WhatsNewGate } from "./whatsnew/WhatsNewGate.jsx";

export function Layout() {
  /* Arena view (beta, Appearance): the stage sits behind the top of every
     page and the page becomes the sheet. Off = today's layout, untouched. */
  const arena = useArenaView();
  useEffect(() => {
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

  return (
    <div className="app">
      {arena ? <ArenaStage /> : null}
      <Navbar />
      {arena ? <div className="arena-spacer" /> : null}
      {arena ? <div className="arena-sheet">{page}</div> : page}
      <BottomNav />
      <WhatsNewGate />
    </div>
  );
}
