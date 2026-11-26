"use client";

import { useState } from "react";
import { Button, Card, Field, Icon, Pill, Toggle, inputCls } from "@/components/ui";
import { CATEGORIES, SCALE_PRESETS, fmt } from "@/lib/scoring";
import { actions } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Rubric, RubricType } from "@/lib/types";

const TYPES: Array<{ value: RubricType; label: string }> = [
  { value: "points", label: "Points" },
  { value: "pct", label: "% Range" },
  { value: "nopoints", label: "No Points" },
];

export function AssignmentCard({ rubric, onDuplicate }: { rubric: Rubric; onDuplicate: () => void }) {
  // Re-mount the number inputs when the rubric or scale changes so they show fresh values.
  const scaleKey = `${rubric.id}:${rubric.floor}:${rubric.ceiling}`;
  const patch = (fn: (r: Rubric) => Rubric) => actions.updateRubric(rubric.id, fn);
  // Settings are rarely changed, so keep them folded and let the student list lead.
  const [open, setOpen] = useState(false);
  const typeLabel = TYPES.find((t) => t.value === rubric.type)?.label ?? "";
  const summary = `${rubric.category.split(" ")[0]} · ${rubric.type === "nopoints" ? "no points" : `${fmt(rubric.floor)}–${fmt(rubric.ceiling)}`} · ${typeLabel}`;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="rubric-settings"
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-3">Rubric settings</span>
          {!open && <span className="mt-1 block text-xs text-ink-2">{summary}</span>}
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ok">
            <Icon name="check" className="size-3" />
            Saved
          </span>
          <Icon name="chevronDown" className={`size-4 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div id="rubric-settings" hidden={!open} className="mt-4 space-y-3">
        <Field label="Name" htmlFor="assignment-name">
          <input id="assignment-name" className={inputCls} value={rubric.name} onChange={(e) => patch((r) => ({ ...r, name: e.target.value }))} />
        </Field>
        <Field label="Category" htmlFor="assignment-category">
          <select id="assignment-category" className={inputCls} value={rubric.category} onChange={(e) => patch((r) => ({ ...r, category: e.target.value }))}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <ScaleFields key={scaleKey} rubric={rubric} />

        <Field label="Rubric type">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Pill key={t.value} active={rubric.type === t.value} onClick={() => patch((r) => ({ ...r, type: t.value }))}>
                {t.label}
              </Pill>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
          <span className="text-xs font-semibold">Half-point increments</span>
          <Toggle label="Half-point increments" checked={rubric.halfPoints} onChange={(v) => patch((r) => ({ ...r, halfPoints: v }))} />
        </div>

        <Button variant="secondary" size="sm" icon="copy" className="w-full" onClick={onDuplicate}>
          Duplicate rubric
        </Button>
      </div>
    </Card>
  );
}

function ScaleFields({ rubric }: { rubric: Rubric }) {
  const [floor, setFloor] = useState(String(rubric.floor));
  const [ceiling, setCeiling] = useState(String(rubric.ceiling));
  const perRow = rubric.rows.length ? (rubric.ceiling - rubric.floor) / rubric.rows.length : 0;

  function apply(f: number, c: number) {
    if (!Number.isFinite(f) || !Number.isFinite(c)) return;
    if (c <= f) {
      toast("Ceiling must be higher than the floor", "warn");
      setFloor(String(rubric.floor));
      setCeiling(String(rubric.ceiling));
      return;
    }
    if (f === rubric.floor && c === rubric.ceiling) return;
    actions.setRubricScale(rubric.id, f, c);
  }

  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-3">Grading scale</p>
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="mb-0.5 block text-[10px] text-ink-3">FLOOR</span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            onBlur={() => apply(parseFloat(floor), parseFloat(ceiling))}
          />
        </label>
        <span className="pb-2 text-ink-3">–</span>
        <label className="flex-1">
          <span className="mb-0.5 block text-[10px] text-ink-3">CEILING</span>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={ceiling}
            onChange={(e) => setCeiling(e.target.value)}
            onBlur={() => apply(parseFloat(floor), parseFloat(ceiling))}
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SCALE_PRESETS.map((p) => (
          <Pill key={p.label} active={rubric.floor === p.floor && rubric.ceiling === p.ceiling} onClick={() => apply(p.floor, p.ceiling)}>
            {p.label}
          </Pill>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        Each criterion is worth <strong className="text-ink-2">{fmt(Math.round(perRow * 100) / 100)}</strong> pts
      </p>
    </div>
  );
}
