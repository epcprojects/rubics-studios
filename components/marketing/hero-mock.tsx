"use client";

import { useState } from "react";
import { Icon, cx } from "@/components/ui";

const ROWS = [
  { criteria: "Concept & Clarity", levels: ["Clearly translated the concept.", "Some understanding, minor gaps.", "Concept not evident."] },
  { criteria: "Composition", levels: ["Balanced use of the frame.", "Some awareness of the frame.", "No awareness of the frame."] },
  { criteria: "Effort", levels: ["Gave 100% effort.", "Some effort, could push further.", "Little effort shown."] },
];
const LABELS = ["Exceeds", "Meets", "Not Yet"];
const PTS = [3, 2, 0];

export function HeroMock() {
  const [picked, setPicked] = useState<Record<number, number>>({ 0: 0, 1: 1 });
  const done = Object.keys(picked).length;
  const total = Object.values(picked).reduce((s, l) => s + PTS[l]!, 0);
  const complete = done === ROWS.length;
  const pct = Math.round((total / 9) * 100);
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-pop sm:p-4" aria-label="Interactive rubric preview">
      <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
        <div>
          <p className="font-display text-4xl leading-none">
            {complete ? total : "–"}
            <span className="ml-1 font-sans text-sm text-ink-3">/ 9</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">{done} of 3 criteria assessed</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-medium">{complete ? `${pct}%` : "–"}</p>
          <p className="text-[10px] text-ink-3">Score</p>
        </div>
        <p className="font-display text-5xl text-brand-600">{complete ? grade : "–"}</p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[460px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[10px] font-medium uppercase tracking-[0.6px] text-ink-3">
              <th className="w-28 px-3 py-2">Criteria</th>
              {LABELS.map((l) => (
                <th key={l} className="px-3 py-2">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.criteria} className="border-t border-line">
                <th scope="row" className="bg-surface-2 px-3 py-2 text-xs font-semibold">{row.criteria}</th>
                {row.levels.map((desc, li) => {
                  const sel = picked[ri] === li;
                  return (
                    <td key={li} className="border-l border-line p-0 align-top">
                      <button
                        type="button"
                        aria-pressed={sel}
                        onClick={() => setPicked((p) => ({ ...p, [ri]: li }))}
                        className={cx(
                          "relative block h-full min-h-[76px] w-full px-3 py-2.5 text-left text-[11px] leading-snug transition-colors",
                          sel
                            ? li === 2
                              ? "bg-bad-bg font-semibold text-bad"
                              : "bg-ok-bg font-semibold text-ok"
                            : "text-ink-2 hover:bg-brand-50 hover:text-brand-700",
                        )}
                      >
                        <span className="mb-1 block text-[10px] font-bold text-brand-600">{PTS[li]} pts</span>
                        {desc}
                        {sel && <Icon name="check" className="absolute top-2 right-2 size-3.5" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
