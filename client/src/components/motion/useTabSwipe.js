import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import {
  decideTabSwipe,
  markTabSwipeNav,
  publishTabSwipe,
  tabIndexOf,
  tabNeighbour,
} from "../../lib/tabSwipe.js";

/**
 * Drag sideways to change tab (Seth, Nov 16: "seamlessly drag my finger and
 * switch between the tabs"). On a tab's own first page a horizontal drag
 * takes the page with it, 1:1; the next tab's outline rides in beside it,
 * and under the Arena the room's camera travels with the finger
 * (lib/tabSwipe.js -> ArenaStage). Let go past a third of the screen, or
 * flick, and the tab changes with the page already in place; otherwise
 * everything slides home. At the first and last tab the page gives a
 * little and comes back.
 *
 * What it leaves alone: a drag that starts vertical (the page scrolls),
 * anything that scrolls sideways itself, form fields, dialogs, the
 * swipe-away bars (they sit outside the page wrapper), the screen's two
 * edges (the system's back gesture), a closer look at the room, and every
 * page deeper than a tab's first.
 *
 * Styles go straight to the elements per touch move; React state only
 * holds which tab's outline is showing.
 * Reduced motion: the same recognition and no tracking - a swipe changes
 * tab with the usual short crossfade.
 *
 * @returns {{ ghost: { key: string, label: string } | null, ghostRef: import("react").RefObject<HTMLElement> }}
 */

const SLOP_PX = 8;
const EDGE_PX = 22;
const NO_SWIPE =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [aria-modal="true"], [role="slider"], [data-no-tab-swipe]';

const easeOut = (p) => 1 - Math.pow(1 - p, 3);

/** Something between the touch and the page that scrolls sideways keeps the drag. */
function scrollsSideways(el, stop) {
  for (let n = el; n && n !== stop && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 1) {
      const o = getComputedStyle(n).overflowX;
      if (o === "auto" || o === "scroll") return true;
    }
  }
  return false;
}

/* Put the page (and the outline beside it) where the drag has it. */
function placeRun(r, wrap, ghost) {
  if (!r || !wrap) return;
  wrap.style.transform = r.q ? `translate3d(${r.q * r.w}px, 0, 0)` : "";
  if (ghost && r.side) ghost.style.transform = `translate3d(${(r.q - r.side) * r.w}px, 0, 0)`;
}

export function useTabSwipe({ wrapperRef, pathname, navigate }) {
  const [ghost, setGhost] = useState(null);
  const ghostRef = useRef(null);
  const live = useRef({ pathname, navigate });
  const run = useRef(null);
  useEffect(() => {
    live.current = { pathname, navigate };
  });

  /* The outline mounts a render after the drag asks for it: place it before paint. */
  useLayoutEffect(() => {
    placeRun(run.current, wrapperRef.current, ghostRef.current);
  });

  /* The tab changed (by this swipe or anything else): everything back to rest
     before the new page paints. */
  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    return () => {
      const r = run.current;
      run.current = null;
      if (r) window.cancelAnimationFrame(r.raf);
      if (wrap) wrap.style.transform = "";
      delete document.documentElement.dataset.tabSwipe;
      setGhost(null);
      if (r) publishTabSwipe(null);
    };
  }, [pathname, wrapperRef]);

  useEffect(() => {
    const root = document.documentElement;
    let touch = null;

    const finish = () => {
      const wrap = wrapperRef.current;
      run.current = null;
      if (wrap) wrap.style.transform = "";
      delete root.dataset.tabSwipe;
      setGhost(null);
      publishTabSwipe(null);
    };

    /* `q`: the page's offset as a share of the width. `side`: which way the
       outline sits (-1 = the next tab, off the right edge). */
    const show = (q) => {
      const r = run.current;
      if (!r) return;
      const side = q < 0 ? -1 : q > 0 ? 1 : r.side;
      const nb = side < 0 ? r.next : side > 0 ? r.prev : null;
      // No tab that way: the page gives a little and no more.
      r.q = nb ? q : Math.sign(q) * Math.min(0.12, Math.abs(q) * 0.25);
      if (side !== r.side) {
        r.side = side;
        setGhost(nb && !r.bare ? { key: nb.key, label: nb.label, top: r.top } : null);
      }
      placeRun(run.current, wrapperRef.current, ghostRef.current);
      publishTabSwipe(nb ? nb.to : null, nb ? Math.abs(r.q) : 0);
    };

    const drop = (t) => {
      t.el.removeEventListener("touchmove", move);
      t.el.removeEventListener("touchend", end);
      t.el.removeEventListener("touchcancel", end);
    };

    const start = (e) => {
      if (touch) drop(touch);
      touch = null;
      if (run.current || e.touches.length !== 1) return;
      const { pathname: path } = live.current;
      if (tabIndexOf(path) === -1 || document.body.style.overflow === "hidden") return;
      const el = e.target instanceof Element ? e.target : null;
      const wrap = wrapperRef.current;
      if (!el || !wrap || el.closest(NO_SWIPE)) return;
      const zone = el.closest(".mx-route, .arena-stage, .arena-peek");
      if (!zone || document.querySelector(".arena-stage[data-zoom]")) return;
      const t = e.touches[0];
      if (t.clientX < EDGE_PX || t.clientX > window.innerWidth - EDGE_PX) return;
      if (scrollsSideways(el, wrap)) return;
      touch = { id: t.identifier, x0: t.clientX, y0: t.clientY, el, on: false, trail: [] };
      // On the touched element: a touch keeps reporting to its target even if React removes it.
      el.addEventListener("touchmove", move, { passive: false });
      el.addEventListener("touchend", end);
      el.addEventListener("touchcancel", end);
    };

    const move = (e) => {
      if (!touch) return;
      const t = e.touches.length === 1 && e.touches[0].identifier === touch.id ? e.touches[0] : null;
      if (!t) {
        end(e);
        return;
      }
      const dx = t.clientX - touch.x0;
      const dy = t.clientY - touch.y0;
      if (!touch.on) {
        if (Math.hypot(dx, dy) < SLOP_PX) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.3 || e.defaultPrevented) {
          drop(touch);
          touch = null;
          return;
        }
        const { pathname: path } = live.current;
        const wrap = wrapperRef.current;
        /* Where the next page's top will be: the top of <main> now, or, with
           the room folded over a scrolled page, right under the folded room. */
        const main = wrap.closest("main") || wrap;
        const mainTop = main.getBoundingClientRect().top;
        const sheet = wrap.closest(".arena-sheet");
        const strip = sheet ? document.querySelector(".arena-strip") : null;
        const floor =
          sheet && strip ? strip.getBoundingClientRect().bottom + (mainTop - sheet.getBoundingClientRect().top) : 0;
        touch.on = true;
        touch.dx0 = dx;
        run.current = {
          q: 0,
          side: 0,
          w: window.innerWidth,
          next: tabNeighbour(path, 1),
          prev: tabNeighbour(path, -1),
          top: Math.max(mainTop, floor),
          // The full view has put the page away: only the room travels.
          bare: Boolean(document.querySelector(".arena-sheet--tour")) || prefersReducedMotion(),
          still: prefersReducedMotion(),
          raf: 0,
        };
        root.dataset.tabSwipe = "";
      }
      /* Not always cancelable (a touch that lands while the page is still
         settling a scroll): the drag is sideways and the page only scrolls
         up and down, so it tracks all the same. */
      if (e.cancelable) e.preventDefault();
      touch.trail.push([e.timeStamp, t.clientX]);
      if (touch.trail.length > 6) touch.trail.shift();
      const r = run.current;
      if (!r) return;
      r.raw = (dx - touch.dx0) / r.w;
      if (!r.still) show(Math.max(-1, Math.min(1, r.raw)));
    };

    const end = (e) => {
      const t = touch;
      touch = null;
      if (!t) return;
      drop(t);
      const r = run.current;
      if (!t.on || !r) return;
      const [t0, x0] = t.trail[0] || [0, 0];
      const [t1, x1] = t.trail[t.trail.length - 1] || [0, 0];
      const v = t1 - t0 > 0 && e.timeStamp - t1 < 120 ? (x1 - x0) / (t1 - t0) : 0;
      const q = r.still ? r.raw || 0 : r.q;
      const side = e.type === "touchcancel" ? 0 : decideTabSwipe({ q, v, next: r.next, prev: r.prev });
      const go = () => {
        const nb = side < 0 ? r.next : r.prev;
        markTabSwipeNav(!r.still);
        live.current.navigate(nb.to);
      };
      if (r.still) {
        finish();
        if (side) go();
        return;
      }
      // Carry it the rest of the way at about the speed it was let go.
      const from = r.q;
      const to = side;
      const px = Math.abs(to - from) * r.w;
      const ms = Math.max(140, Math.min(340, px / Math.max(Math.abs(v), 1.4)));
      const began = performance.now();
      const step = (now) => {
        if (run.current !== r) return;
        const p = Math.min(1, (now - began) / ms);
        const at = from + (to - from) * easeOut(p);
        // Keep the side through the last frame so the outline stays put.
        r.q = at;
        placeRun(run.current, wrapperRef.current, ghostRef.current);
        const nb = r.side < 0 ? r.next : r.side > 0 ? r.prev : null;
        publishTabSwipe(nb ? nb.to : null, nb ? Math.abs(at) : 0);
        if (p < 1) {
          r.raf = window.requestAnimationFrame(step);
          return;
        }
        if (side) go();
        else finish();
      };
      r.raf = window.requestAnimationFrame(step);
    };

    document.addEventListener("touchstart", start, { passive: true });
    return () => {
      if (touch) drop(touch);
      document.removeEventListener("touchstart", start);
    };
  }, [wrapperRef]);

  return { ghost, ghostRef };
}
