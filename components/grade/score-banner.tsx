import { fmt, type Score } from "@/lib/scoring";
import type { Rubric } from "@/lib/types";

export function ScoreBanner({ rubric, score }: { rubric: Rubric; score: Score }) {
  const nopts = rubric.type === "nopoints";
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-100 bg-brand-50 px-6 py-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Total score</p>
        <p className="font-display text-5xl leading-none text-ink">
          {!nopts && score.total !== null ? fmt(score.total) : "–"}
          <span className="ml-1.5 font-sans text-base text-ink-3">{nopts ? "no points" : `/ ${fmt(rubric.ceiling)}`}</span>
        </p>
        {!score.complete && (
          <p className="mt-1.5 text-xs text-ink-3">
            {score.scored} of {score.of} criteria assessed
          </p>
        )}
      </div>
      <div className="text-center">
        <p className="text-2xl font-medium text-ink">{score.pct !== null && !nopts ? `${score.pct}%` : "–"}</p>
        <p className="text-xs text-ink-3">Score</p>
      </div>
      <p className="font-display text-6xl text-brand-600" aria-label="Letter grade">
        {score.grade && !nopts ? score.grade : "–"}
      </p>
    </div>
  );
}
