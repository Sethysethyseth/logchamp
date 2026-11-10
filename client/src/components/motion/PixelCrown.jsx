import { CROWN } from "./crownIntroEngine.js";

/* The crown as crisp square pixels (the crown intro's grid), one rect per
   run of lit cells. Colour follows `currentColor`. */
const RUNS = CROWN.flatMap((row, y) => {
  const runs = [];
  let start = -1;
  for (let x = 0; x <= row.length; x += 1) {
    const on = row[x] === "#";
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      runs.push({ x: start, y, w: x - start });
      start = -1;
    }
  }
  return runs;
});

export function PixelCrown({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${CROWN[0].length} ${CROWN.length}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      {RUNS.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
      ))}
    </svg>
  );
}
