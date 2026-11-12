/**
 * Arena view: what the boards say, from data a page already holds. Pure -
 * no DOM, no React, no fetch. Weights go through an injected `toUnit` and
 * carry an injected unit label; the arena passes the pages' own.
 *
 * Lines come back ready for the LED font (A-Z 0-9 : + - . and spaces).
 */

import { ledFit } from "./arenaSheet.js";
import { buildExecutionVerdict } from "./executionVerdict.js";
import { pickTopGain } from "./topGain.js";

const NOT_PAIRED = "not enough paired data";
const ON_PLAN = "executed right on plan";
const BLOCK_WEEKS = 8;
const CHALK_CHARS = 9;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const list = (value) => (Array.isArray(value) ? value : []);
const finishedAt = (session) => {
  const t = new Date(session?.completedAt || NaN).getTime();
  return Number.isNaN(t) ? null : t;
};

/* One decimal at most, `.0` dropped: 225 -> "225", 102.5 -> "102.5". */
function weightText(n) {
  const s = Number(n).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function setText(topSet, toUnit) {
  const w = weightText(toUnit(Number(topSet.weight)));
  return topSet.reps != null ? `${w}X${Math.round(Number(topSet.reps))}` : w;
}

/* Heaviest first; ties, more reps first. Stable otherwise. */
function byTopSet(a, b) {
  return b.topSet.weight - a.topSet.weight || (b.topSet.reps ?? 0) - (a.topSet.reps ?? 0);
}

function withTopSet(perExercise) {
  return list(perExercise).filter((ex) => ex?.topSet && ex.topSet.weight != null);
}

function hasData(summary) {
  return Boolean(summary) && (list(summary.perMuscle).length > 0 || list(summary.perExercise).length > 0);
}

function musclesFace(summary) {
  const sorted = [...list(summary.perMuscle)].sort((a, b) => (b.effectiveSets ?? 0) - (a.effectiveSets ?? 0));
  const rows = sorted
    .slice(0, 5)
    .map((m) => ({ label: String(m.muscle ?? "").slice(0, 3).toUpperCase(), value: Number(m.effectiveSets) || 0 }));
  const top = sorted[0];
  const lines = top ? [ledFit(top.muscle, 9), count(Math.round(Number(top.effectiveSets) || 0), "SET", "SETS")] : ["MUSCLES", "--"];
  return { title: "MUSCLES", lines, rows };
}

function strengthFace(summary, toUnit) {
  let best = null;
  for (const ex of list(summary.perExercise)) {
    const n = list(ex?.e1rmSeries).length;
    if (n > 0 && (!best || n > list(best.e1rmSeries).length)) best = ex;
  }
  if (!best) return { title: "STRENGTH", lines: ["E1RM", "--"], spark: [], e1rm: null };
  const spark = list(best.e1rmSeries)
    .slice(-10)
    .map((p) => toUnit(Number(p.epley) || 0));
  const e1rm = Math.round(spark[spark.length - 1]);
  return { title: "STRENGTH", lines: [`E1RM ${e1rm}`, ledFit(best.name, 9)], spark, e1rm };
}

function exercisesFace(summary, toUnit) {
  const rows = withTopSet(summary.perExercise)
    .sort(byTopSet)
    .slice(0, 4)
    .map((ex) => ({ name: String(ex.name ?? ""), set: setText(ex.topSet, toUnit) }));
  const lines = rows.length ? [ledFit(rows[0].name, 9), rows[0].set] : ["EXERCISES", "--"];
  return { title: "EXERCISES", lines, rows };
}

function executionFace(summary) {
  let paired = 0;
  let onPlan = 0;
  for (const row of list(summary.execution)) {
    const verdict = buildExecutionVerdict({
      loadAdherence: row?.loadAdherence ?? null,
      volumeAdherence: row?.volumeAdherence ?? null,
      effortDrift: row?.effortDrift ?? null,
    });
    if (verdict === NOT_PAIRED) continue;
    paired += 1;
    if (verdict === ON_PLAN) onPlan += 1;
  }
  if (!paired) return { title: "EXECUTION", lines: ["ON PLAN", "--"], pct: null };
  const pct = Math.round((onPlan / paired) * 100);
  return { title: "EXECUTION", lines: [String(pct), "ON PLAN"], pct };
}

/**
 * The four Analytics views as board faces, in the page's tab order:
 * muscles, strength, exercises, execution. `null` without data.
 */
export function analyticsFaces(summary, { toUnit = (n) => n } = {}) {
  if (!hasData(summary)) return null;
  return [musclesFace(summary), strengthFace(summary, toUnit), exercisesFace(summary, toUnit), executionFace(summary)];
}

/** Home's week, one face at a time: sets, workouts, then what the 7-day summary has. */
export function weekFaces({ sets = 0, workouts = 0, summary = null } = {}, { toUnit = (n) => n, unit = "LB" } = {}) {
  const faces = [
    ["7 DAYS", count(sets, "SET", "SETS")],
    ["7 DAYS", count(workouts, "WORKOUT", "WORKOUTS")],
  ];
  if (!summary) return faces;
  const top = withTopSet(summary.perExercise).sort(byTopSet)[0];
  if (top) faces.push(["TOP SET", setText(top.topSet, toUnit)]);
  const gain = pickTopGain(list(summary.perExercise));
  const delta = gain ? Math.round(toUnit(gain.delta)) : 0;
  if (delta > 0) faces.push(["TOP GAIN", `+${delta} ${unit}`]);
  const records = list(summary.prs).length;
  if (records > 0) faces.push(["RECORDS", String(records)]);
  return faces;
}

/** The first sentence: up to the first `.`, `!` or `?` that ends the text or is followed by a space. */
export function firstSentence(text) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  const m = s.match(/^.*?[.!?](?= |$)/);
  return m ? m[0] : s;
}

/** A sentence for the full-view line (markdown marks dropped), cut at a word to `max` characters. */
export function chalkSentence(text, max = 60) {
  const s = firstSentence(String(text ?? "").replace(/[*_`#]+/g, ""));
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1).replace(/\s+\S*$/, "");
  return cut || s.slice(0, max);
}

/** The chalkboard: a coach answer's first sentence on at most two LED lines. */
export function chalkLines(text) {
  const clean = ledFit(firstSentence(text), Number.MAX_SAFE_INTEGER);
  if (!clean) return ["ASK ME", "ANYTHING"];
  const lines = [];
  let cur = "";
  for (const raw of clean.split(" ")) {
    const word = raw.slice(0, CHALK_CHARS);
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= CHALK_CHARS) cur += ` ${word}`;
    else {
      lines.push(cur);
      cur = word;
      if (lines.length === 2) break;
    }
  }
  if (cur && lines.length < 2) lines.push(cur);
  return lines;
}

/**
 * The rack's program board. `cells[w][d]`: 2 done, 1 the next day (first
 * not-done day of the current week), 0 otherwise. At most 8 weeks shown.
 */
export function blockBoard(block) {
  const progress = block?.progress;
  const weeks = list(progress?.weeks);
  if (!progress || weeks.length === 0) return null;
  const current = progress.currentWeekOrder;
  const currentIndex = Math.max(0, weeks.findIndex((w) => w.order === current));
  let done = 0;
  let total = 0;
  const all = weeks.map((week, w) => {
    const days = list(week?.days);
    const next = w === currentIndex ? days.findIndex((d) => d?.status !== "done") : -1;
    return days.map((day, d) => {
      total += 1;
      if (day?.status === "done") {
        done += 1;
        return 2;
      }
      return d === next ? 1 : 0;
    });
  });
  const start = Math.max(0, Math.min(currentIndex - 3, weeks.length - BLOCK_WEEKS));
  return {
    label: `BLOCK W${current ?? weeks[currentIndex].order}`,
    done,
    total,
    cells: all.slice(start, start + BLOCK_WEEKS),
  };
}

/**
 * The selected workout's seat: its index among completed sessions, oldest
 * first. A missing or unfinished selection is the newest seat; -1 with none.
 */
export function seatIndex(sessions, selectedId) {
  const done = list(sessions)
    .filter((session) => finishedAt(session) != null)
    .sort((a, b) => finishedAt(a) - finishedAt(b));
  if (!done.length) return -1;
  const i = selectedId == null ? -1 : done.findIndex((session) => String(session?.id) === String(selectedId));
  return i >= 0 ? i : done.length - 1;
}

/** History's strip: the selected workout's date and title, else the count. Line 2 is fitted by the strip. */
export function historyStrip({ seats = 0, selected = null } = {}) {
  const d = selected ? new Date(selected.completedAt) : null;
  if (!d || Number.isNaN(d.getTime())) return ["HISTORY", count(seats, "WORKOUT", "WORKOUTS")];
  return [`${MONTHS[d.getMonth()]} ${d.getDate()}`, String(selected.title ?? "")];
}

/** Library's strip: the running block (`blockBoard` result), else the saved-workout count. */
export function libraryStrip({ block = null, workouts = null } = {}) {
  if (block) return [block.label, `${block.done} OF ${block.total} DAYS`];
  if (workouts == null) return ["LIBRARY", ""];
  return ["LIBRARY", count(workouts, "WORKOUT", "WORKOUTS")];
}

/** Profile's strip: the week streak, else the workout count. */
export function profileStrip({ streak = 0, workouts = 0 } = {}) {
  if (streak >= 1) return ["STREAK", count(streak, "WEEK", "WEEKS")];
  return ["PROFILE", count(workouts, "WORKOUT", "WORKOUTS")];
}

/** The rafters' banners: first workout, 100, 1000. */
export function banners(workouts) {
  const w = Number(workouts) || 0;
  return [
    { label: "", earned: w >= 1 },
    { label: "100", earned: w >= 100 },
    { label: "1K", earned: w >= 1000 },
  ];
}
