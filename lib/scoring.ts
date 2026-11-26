import type { GradeEntry, Rubric, RubricRow } from "./types";

export function fmt(n: number): number {
  return Number.isInteger(n) ? n : parseFloat(n.toFixed(2));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function letterGrade(pct: number): "A" | "B" | "C" | "D" | "F" {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

/** Spread the scale range evenly across rows and levels, top level first, bottom level 0. */
export function rescale(rubric: Rubric): Rubric {
  const range = rubric.ceiling - rubric.floor;
  const perRow = round2(range / Math.max(1, rubric.rows.length));
  return {
    ...rubric,
    rows: rubric.rows.map((row) => {
      const n = row.ratings.length;
      return {
        ...row,
        max: perRow,
        ratings: row.ratings.map((r, i) => ({
          ...r,
          pts: i === n - 1 && n > 1 ? 0 : n > 1 ? round2((perRow * (n - 1 - i)) / (n - 1)) : perRow,
        })),
      };
    }),
  };
}

export function rowMax(row: RubricRow): number {
  return row.ratings.reduce((m, r) => Math.max(m, r.pts), 0);
}

export function maxEarnable(rubric: Rubric): number {
  return round2(rubric.rows.reduce((s, r) => s + rowMax(r), 0));
}

export function rowPoints(row: RubricRow, entry: GradeEntry | undefined): number | null {
  if (!entry) return null;
  const sel = entry.ratings[row.id];
  if (sel === undefined) return null;
  const override = entry.sliders[row.id];
  const rating = row.ratings[sel];
  // A level that was deleted from the rubric no longer counts as scored.
  if (!rating) return null;
  return override !== undefined ? override : rating.pts;
}

export interface Score {
  scored: number;
  of: number;
  complete: boolean;
  /** Points earned on the rubric plus bonus, excluding the floor. */
  earned: number;
  /** Final score on the teacher's scale, including the floor. */
  total: number | null;
  pct: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
}

export function computeScore(rubric: Rubric, entry: GradeEntry | undefined): Score {
  const of = rubric.rows.length;
  let scored = 0;
  let sum = 0;
  for (const row of rubric.rows) {
    const p = rowPoints(row, entry);
    if (p !== null) {
      scored += 1;
      sum += p;
    }
  }
  const complete = of > 0 && scored === of;
  const earned = round2(sum + (entry?.bonus ?? 0));
  if (!complete || rubric.type === "nopoints") {
    return { scored, of, complete, earned, total: null, pct: null, grade: null };
  }
  const max = maxEarnable(rubric) || 1;
  const pct = Math.max(0, Math.min(100, Math.round((earned / max) * 100)));
  return {
    scored,
    of,
    complete,
    earned,
    total: round2(earned + rubric.floor),
    pct,
    grade: letterGrade(pct),
  };
}

export const SCALE_PRESETS: Array<{ floor: number; ceiling: number; label: string }> = [
  { floor: 0, ceiling: 10, label: "0–10" },
  { floor: 0, ceiling: 50, label: "0–50" },
  { floor: 0, ceiling: 100, label: "0–100" },
  { floor: 50, ceiling: 100, label: "50–100" },
];

export const CATEGORIES = [
  "Summative Assessment",
  "Formative Assessment",
  "Homework",
  "Classwork",
] as const;
