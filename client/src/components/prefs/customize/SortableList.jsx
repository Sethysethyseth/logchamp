import { useEffect, useRef } from "react";

const HOLD_MS = 320;
const MOVE_CANCEL_PX = 8;

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function layoutTop(mod) {
  return mod.parentElement.getBoundingClientRect().top + mod.offsetTop;
}

/**
 * Sortable section list: grip drag or 320ms hold, FLIP neighbours,
 * edge auto-scroll, spring settle. Port of phone.src.html ~371-491.
 *
 * @param {{
 *   listKey: string,
 *   ids: string[],
 *   onReorder: (ids: string[]) => void,
 *   children: React.ReactNode
 * }} props
 */
export function SortableList({ listKey, ids, onReorder, children }) {
  const listRef = useRef(null);
  const idsRef = useRef(ids);
  const onReorderRef = useRef(onReorder);
  idsRef.current = ids;
  onReorderRef.current = onReorder;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    let drag = null;
    let hold = null;
    let scrollRaf = 0;

    const mods = () => [...list.querySelectorAll(":scope > .cz-mod")];

    const commit = () => {
      const order = mods().map((m) => m.dataset.id);
      onReorderRef.current?.(order);
    };

    const flip = (change) => {
      const nodes = mods();
      const before = new Map(nodes.map((m) => [m, m.getBoundingClientRect().top]));
      change();
      if (prefersReducedMotion()) return;
      nodes.forEach((m) => {
        if (drag && m === drag.mod) return;
        const d = before.get(m) - m.getBoundingClientRect().top;
        if (!d) return;
        m.style.transition = "none";
        m.style.transform = `translateY(${d}px)`;
        requestAnimationFrame(() => {
          m.style.transition = "";
          m.style.transform = "";
        });
      });
    };

    const follow = () => {
      if (!drag) return;
      const { mod } = drag;
      mod.style.transform = `translate3d(0, ${drag.lastY - drag.grab - layoutTop(mod)}px, 0)`;
    };

    const place = () => {
      if (!drag) return;
      const { mod } = drag;
      const top = drag.lastY - drag.grab;
      const bottom = top + mod.offsetHeight;
      const nodes = mods();
      const me = nodes.indexOf(mod);
      let before = null;
      for (let i = 0; i < nodes.length; i += 1) {
        const s = nodes[i];
        if (s === mod) continue;
        const mid = layoutTop(s) + s.offsetHeight / 2;
        if (i < me ? top < mid : bottom < mid) {
          before = s;
          break;
        }
      }
      if (before !== mod.nextElementSibling) {
        flip(() => list.insertBefore(mod, before));
        try {
          mod.setPointerCapture(drag.id);
        } catch {
          /* released */
        }
      }
    };

    const tickScroll = () => {
      if (!drag) return;
      const H = window.innerHeight;
      const edge = 80;
      const v =
        drag.lastY < edge
          ? -(edge - drag.lastY) / 4
          : drag.lastY > H - edge - 70
            ? (drag.lastY - (H - edge - 70)) / 4
            : 0;
      if (v) {
        const doc = document.scrollingElement || document.documentElement;
        doc.scrollTop += v;
        place();
        follow();
      }
      scrollRaf = requestAnimationFrame(tickScroll);
    };

    const startDrag = (mod, e) => {
      const r = mod.getBoundingClientRect();
      try {
        mod.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
      drag = {
        mod,
        id: e.pointerId,
        lastY: e.clientY,
        grab: e.clientY - r.top,
      };
      mod.classList.remove("is-holding");
      mod.classList.add("is-dragging");
      list.classList.add("is-sorting");
      try {
        if (navigator.vibrate) navigator.vibrate(8);
      } catch {
        /* no vibrate */
      }
      scrollRaf = requestAnimationFrame(tickScroll);
    };

    const cancelHold = () => {
      if (!hold) return;
      clearTimeout(hold.t);
      hold.mod.classList.remove("is-holding");
      hold = null;
    };

    const endDrag = (e) => {
      if (hold && (!e || e.pointerId === hold.id)) cancelHold();
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const { mod } = drag;
      drag = null;
      cancelAnimationFrame(scrollRaf);
      list.classList.remove("is-sorting");
      mod.classList.remove("is-dragging");
      mod.classList.add("is-settling");
      mod.style.transition = prefersReducedMotion()
        ? "none"
        : "transform 420ms cubic-bezier(.3,1.3,.5,1)";
      mod.style.transform = "";
      setTimeout(() => {
        mod.style.transition = "";
        mod.classList.remove("is-settling");
      }, 440);
      commit();
    };

    const onPointerDown = (e) => {
      if (e.button > 0 || drag) return;
      const mod = e.target.closest(".cz-mod");
      if (!mod || !list.contains(mod) || e.target.closest(".cz-tg")) return;
      if (e.target.closest(".cz-grip")) {
        e.preventDefault();
        startDrag(mod, e);
        return;
      }
      mod.classList.add("is-holding");
      hold = {
        mod,
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId,
        t: setTimeout(() => {
          const h = hold;
          hold = null;
          if (h) startDrag(h.mod, { pointerId: h.id, clientY: h.y });
        }, HOLD_MS),
      };
    };

    const onPointerMove = (e) => {
      if (
        hold &&
        e.pointerId === hold.id &&
        Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > MOVE_CANCEL_PX
      ) {
        cancelHold();
      }
      if (!drag || e.pointerId !== drag.id) return;
      drag.lastY = e.clientY;
      place();
      follow();
    };

    const onTouchMove = (e) => {
      if (drag) e.preventDefault();
    };

    const onKeyDown = (e) => {
      const g = e.target.closest(".cz-grip");
      if (!g || !list.contains(g) || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      const mod = g.closest(".cz-mod");
      const sib = e.key === "ArrowUp" ? mod.previousElementSibling : mod.nextElementSibling;
      if (!sib || !sib.classList.contains("cz-mod")) return;
      flip(() =>
        e.key === "ArrowUp" ? list.insertBefore(mod, sib) : list.insertBefore(sib, mod)
      );
      commit();
      g.focus();
    };

    list.addEventListener("pointerdown", onPointerDown);
    list.addEventListener("pointermove", onPointerMove);
    list.addEventListener("pointerup", endDrag);
    list.addEventListener("pointercancel", endDrag);
    list.addEventListener("keydown", onKeyDown);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("blur", endDrag);

    return () => {
      cancelHold();
      cancelAnimationFrame(scrollRaf);
      list.removeEventListener("pointerdown", onPointerDown);
      list.removeEventListener("pointermove", onPointerMove);
      list.removeEventListener("pointerup", endDrag);
      list.removeEventListener("pointercancel", endDrag);
      list.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("blur", endDrag);
    };
  }, []);

  /* After React re-renders from a committed order, DOM already matches;
     during drag, insertBefore mutates DOM ahead of React - sync keys via ids. */
  return (
    <div className="cz-list" data-list={listKey} ref={listRef}>
      {children}
    </div>
  );
}
