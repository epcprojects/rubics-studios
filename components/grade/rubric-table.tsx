"use client";

import { Button, Icon, cx, inputCls } from "@/components/ui";
import { fmt, rowMax, rowPoints } from "@/lib/scoring";
import type { GradeEntry, Rubric, RubricRow } from "@/lib/types";

interface Props {
  rubric: Rubric;
  entry: GradeEntry | undefined;
  editMode: boolean;
  onSelect: (rowId: string, index: number) => void;
  onSlider: (rowId: string, value: number) => void;
  onChange: (fn: (r: Rubric) => Rubric) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);

export function RubricTable({ rubric, entry, editMode, onSelect, onSlider, onChange }: Props) {
  const nopts = rubric.type === "nopoints";
  const levels = rubric.rows[0]?.ratings ?? [];
  const step = rubric.halfPoints ? 0.5 : 1;

  const patchRow = (rowId: string, fn: (row: RubricRow) => RubricRow) =>
    onChange((r) => ({ ...r, rows: r.rows.map((row) => (row.id === rowId ? fn(row) : row)) }));

  const addRow = () =>
    onChange((r) => {
      const n = levels.length || 3;
      const row: RubricRow = {
        id: `row_${uid()}`,
        criteria: "New criteria",
        max: n - 1,
        ratings: Array.from({ length: n }, (_, i) => ({
          label: levels[i]?.label ?? `Level ${i + 1}`,
          pts: n - 1 - i,
          desc: "Add a description.",
        })),
      };
      return { ...r, rows: [...r.rows, row] };
    });

  const addColumn = () =>
    onChange((r) => ({
      ...r,
      rows: r.rows.map((row) => ({
        ...row,
        ratings: [...row.ratings, { label: `Level ${row.ratings.length + 1}`, pts: 0, desc: "Add a description." }],
      })),
    }));

  const removeColumn = (ci: number) =>
    onChange((r) => ({
      ...r,
      rows: r.rows.map((row) => {
        const ratings = row.ratings.filter((_, i) => i !== ci);
        return { ...row, ratings, max: ratings.reduce((m, x) => Math.max(m, x.pts), 0) };
      }),
    }));

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-[10px] font-medium uppercase tracking-[0.6px] text-ink-3">
              <th className="w-36 px-3 py-2.5">Criteria</th>
              {levels.map((l, ci) => (
                <th key={ci} className="px-3 py-2.5">
                  {editMode ? (
                    <span className="flex items-center gap-1">
                      <input
                        aria-label={`Level ${ci + 1} name`}
                        value={l.label}
                        onChange={(e) =>
                          onChange((r) => ({
                            ...r,
                            rows: r.rows.map((row) => ({
                              ...row,
                              ratings: row.ratings.map((x, i) => (i === ci ? { ...x, label: e.target.value } : x)),
                            })),
                          }))
                        }
                        className="w-full min-w-16 rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold uppercase text-ink outline-none focus:border-brand-600"
                      />
                      {levels.length > 2 && (
                        <button type="button" onClick={() => removeColumn(ci)} aria-label={`Remove level ${l.label}`} className="rounded p-1 text-ink-3 hover:bg-brand-50 hover:text-ink">
                          <Icon name="x" className="size-3.5" />
                        </button>
                      )}
                    </span>
                  ) : (
                    l.label
                  )}
                </th>
              ))}
              {!nopts && !editMode && <th className="w-20 px-2 py-2.5 text-center">Pts</th>}
              {editMode && (
                <th className="w-10 px-2 py-2.5 text-center">
                  <button type="button" onClick={addColumn} aria-label="Add level" className="rounded p-1 text-ink-2 hover:bg-brand-50">
                    <Icon name="plus" className="size-4" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rubric.rows.map((row) => {
              const sel = entry?.ratings[row.id];
              const pts = rowPoints(row, entry);
              const max = rowMax(row);
              return (
                <tr key={row.id} className="border-t border-line">
                  <th scope="row" className="bg-surface-2 px-3 py-2.5 text-left align-middle text-sm font-semibold leading-snug">
                    {editMode ? (
                      <div className="space-y-1.5">
                        <textarea
                          aria-label="Criteria name"
                          rows={2}
                          value={row.criteria}
                          onChange={(e) => patchRow(row.id, (x) => ({ ...x, criteria: e.target.value }))}
                          className={`${inputCls} resize-none text-xs`}
                        />
                        {rubric.rows.length > 1 && (
                          <Button size="sm" variant="danger" icon="trash" onClick={() => onChange((r) => ({ ...r, rows: r.rows.filter((x) => x.id !== row.id) }))}>
                            Remove
                          </Button>
                        )}
                      </div>
                    ) : (
                      row.criteria
                    )}
                  </th>

                  {row.ratings.map((rt, ri) => {
                    if (editMode) {
                      return (
                        <td key={ri} className="border-l border-line p-2 align-top">
                          <div className="space-y-1.5">
                            <input
                              aria-label="Level name"
                              value={rt.label}
                              onChange={(e) => patchRow(row.id, (x) => ({ ...x, ratings: x.ratings.map((y, i) => (i === ri ? { ...y, label: e.target.value } : y)) }))}
                              className={`${inputCls} py-1 text-xs font-semibold`}
                            />
                            {!nopts && (
                              <input
                                aria-label="Points"
                                type="number"
                                step={0.5}
                                min={0}
                                value={rt.pts}
                                onChange={(e) =>
                                  patchRow(row.id, (x) => {
                                    const ratings = x.ratings.map((y, i) => (i === ri ? { ...y, pts: parseFloat(e.target.value) || 0 } : y));
                                    return { ...x, ratings, max: ratings.reduce((m, z) => Math.max(m, z.pts), 0) };
                                  })
                                }
                                className={`${inputCls} w-20 py-1 text-xs`}
                              />
                            )}
                            <textarea
                              aria-label="Description"
                              rows={3}
                              value={rt.desc}
                              onChange={(e) => patchRow(row.id, (x) => ({ ...x, ratings: x.ratings.map((y, i) => (i === ri ? { ...y, desc: e.target.value } : y)) }))}
                              className={`${inputCls} resize-none text-xs`}
                            />
                          </div>
                        </td>
                      );
                    }
                    const selected = sel === ri;
                    return (
                      <td key={ri} className="border-l border-line p-0 align-top">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onSelect(row.id, ri)}
                          className={cx(
                            "relative block h-full min-h-[84px] w-full px-3 py-2.5 pr-7 text-left text-xs leading-relaxed transition-colors",
                            selected
                              ? rt.pts > 0
                                ? "bg-[#eaf2e3] font-medium text-[#55784a] ring-[1.5px] ring-inset ring-[#789a65]"
                                : "bg-bad-bg font-medium text-bad ring-[1.5px] ring-inset ring-[#e3a998]"
                              : "text-ink-2 hover:bg-brand-50 hover:text-brand-700",
                          )}
                        >
                          {!nopts && (
                            <span className="mb-1 block text-[11px] font-bold text-brand-600">
                              {rubric.type === "pct" ? `${max > 0 ? Math.round((rt.pts / max) * 100) : 0}%` : `${fmt(rt.pts)} ${rt.pts === 1 ? "pt" : "pts"}`}
                            </span>
                          )}
                          {rt.desc}
                          {selected && <Icon name="check" className="absolute top-2.5 right-2.5 size-4" />}
                        </button>
                      </td>
                    );
                  })}

                  {!nopts && !editMode && (
                    <td className="w-20 border-l border-line px-2 py-2 text-center align-middle">
                      <p className="font-display text-xl font-extrabold text-brand-600">{pts === null ? "–" : fmt(pts)}</p>
                      <p className="text-[10px] text-ink-3">/ {fmt(max)}</p>
                      {max > 0 && (
                        <input
                          type="range"
                          aria-label={`Fine-tune points for ${row.criteria}`}
                          min={0}
                          max={max}
                          step={step}
                          disabled={sel === undefined}
                          value={pts ?? 0}
                          onChange={(e) => onSlider(row.id, parseFloat(e.target.value))}
                          className="mt-1.5 w-16 cursor-pointer accent-brand-600 disabled:cursor-default disabled:opacity-25"
                        />
                      )}
                    </td>
                  )}
                  {editMode && <td className="border-l border-line" />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editMode && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-line bg-surface-2 py-2.5 text-xs font-semibold text-ink-3 transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700"
        >
          <Icon name="plus" className="size-4" />
          Add criteria row
        </button>
      )}
    </div>
  );
}
