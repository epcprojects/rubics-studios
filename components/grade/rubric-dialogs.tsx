"use client";

import { useRef, useState } from "react";
import { Button, Dots, Field, Icon, Modal, Pill, inputCls } from "@/components/ui";
import { generateRubric, importRubricFile } from "@/lib/ai-mock";
import { maxEarnable, rescale } from "@/lib/scoring";
import { actions } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Rubric, RubricRow } from "@/lib/types";

function toRubric(name: string, rows: RubricRow[], ceiling = 100): Rubric {
  return rescale({
    id: "",
    name,
    category: "Summative Assessment",
    type: "points",
    floor: 0,
    ceiling,
    halfPoints: false,
    createdAt: "",
    updatedAt: "",
    rows,
  });
}

const EXAMPLES = [
  "Persuasive essay rubric, 4 columns, Expert to Still Approaching",
  "American Revolution timeline project, 4 levels",
  "Science lab report, 3 columns, Exceeds to Not Yet",
  "Oral presentation rubric, 5 levels",
];

// ───────────────────────── AI generator ─────────────────────────

export function AIDialog({ open, onClose, onUpgrade, onCreated }: { open: boolean; onClose: () => void; onUpgrade: (r: string) => void; onCreated: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    const out = await generateRubric(prompt);
    const res = actions.createRubric(toRubric(out.name, out.rows));
    setBusy(false);
    if (!res.ok) {
      onClose();
      onUpgrade(res.error);
      return;
    }
    actions.logAI(`Generated rubric "${out.name}" with AI`);
    toast("Rubric generated. Edit it any way you like.", "pro");
    setPrompt("");
    onClose();
    onCreated();
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={
        <span className="flex items-center gap-2">
          <Icon name="sparkles" className="size-5 text-accent" />
          AI rubric generator
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="pro" icon="sparkles" onClick={run} disabled={!prompt.trim() || busy}>
            {busy ? "Generating…" : "Generate rubric"}
          </Button>
        </>
      }
    >
      <Field label="Describe the assignment" htmlFor="ai-prompt">
        <textarea
          id="ai-prompt"
          className={`${inputCls} min-h-24 resize-none`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. American History rubric, timeline of the American Revolution, 4 columns, Expert to Still Approaching"
          disabled={busy}
        />
      </Field>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((e) => (
          <Pill key={e} onClick={() => setPrompt(e)}>{e}</Pill>
        ))}
      </div>
      {busy && <div className="mt-4"><Dots label="Writing your rubric…" /></div>}
      <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-3">
        Prototype note: this returns a sample rubric built from your wording. The production version calls the Claude API.
      </p>
    </Modal>
  );
}

// ───────────────────────── upload ─────────────────────────

export function UploadDialog({ open, onClose, onUpgrade, onCreated }: { open: boolean; onClose: () => void; onUpgrade: (r: string) => void; onCreated: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(f: File | undefined) {
    if (!f) return;
    if (!/^image\//.test(f.type) && f.type !== "application/pdf") {
      toast("Please choose a JPG, PNG or PDF", "warn");
      return;
    }
    setFile(f.name);
    setBusy(true);
    const out = await importRubricFile(f.name);
    const res = actions.createRubric(toRubric(out.name, out.rows));
    setBusy(false);
    setFile(null);
    if (!res.ok) {
      onClose();
      onUpgrade(res.error);
      return;
    }
    actions.logAI(`Imported rubric "${out.name}" from an upload`);
    toast("Rubric imported", "pro");
    onClose();
    onCreated();
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Upload an existing rubric" footer={<Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>}>
      <p className="mb-4 text-sm text-ink-2">Upload a photo or PDF and it becomes a live rubric you can grade with.</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files[0]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? "border-brand-600 bg-brand-50" : "border-line bg-surface-2 hover:border-brand-200"}`}
      >
        <Icon name="upload" className="mx-auto size-8 text-brand-600" />
        <p className="mt-3 text-sm font-semibold text-ink-2">Drag and drop, or click to browse</p>
        <p className="mt-1 text-xs text-ink-3">JPG, PNG or PDF</p>
        <input ref={input} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      {file && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-2">
          <Icon name="file" className="size-4" />
          <strong className="truncate">{file}</strong>
        </p>
      )}
      {busy && <div className="mt-4"><Dots label="Reading your rubric…" /></div>}
      <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-3">
        Prototype note: any file produces a sample rubric. The production version extracts the real table with the Claude API.
      </p>
    </Modal>
  );
}

// ───────────────────────── builder ─────────────────────────

type Cell = { label: string; pts: string; desc: string };

function makeGrid(rows: number, cols: number, old: Array<{ criteria: string; cells: Cell[] }>) {
  return Array.from({ length: rows }, (_, r) => ({
    criteria: old[r]?.criteria ?? "",
    cells: Array.from({ length: cols }, (_, c) => old[r]?.cells[c] ?? { label: "", pts: "", desc: "" }),
  }));
}

export function BuilderDialog({ open, onClose, onUpgrade, onCreated }: { open: boolean; onClose: () => void; onUpgrade: (r: string) => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [grid, setGrid] = useState(() => makeGrid(3, 3, []));

  function resize(nr: number, nc: number) {
    const r = Math.max(1, Math.min(12, nr || 1));
    const c = Math.max(2, Math.min(6, nc || 2));
    setRows(r);
    setCols(c);
    setGrid((g) => makeGrid(r, c, g));
  }

  const setCell = (r: number, c: number, patch: Partial<Cell>) =>
    setGrid((g) => g.map((row, ri) => (ri !== r ? row : { ...row, cells: row.cells.map((cell, ci) => (ci === c ? { ...cell, ...patch } : cell)) })));

  function build() {
    const custom = grid.some((row) => row.cells.some((c) => parseFloat(c.pts) > 0));
    const rubricRows: RubricRow[] = grid.map((row, r) => {
      const ratings = row.cells.map((c, ci) => ({
        label: c.label.trim() || `Level ${ci + 1}`,
        pts: parseFloat(c.pts) || 0,
        desc: c.desc.trim(),
      }));
      return {
        id: `row_${r}_${Math.random().toString(36).slice(2, 6)}`,
        criteria: row.criteria.trim() || `Criteria ${r + 1}`,
        ratings,
        max: ratings.reduce((m, x) => Math.max(m, x.pts), 0),
      };
    });
    let rubric = toRubric(name.trim() || "Custom rubric", rubricRows, 10);
    if (custom) {
      // Keep the points the teacher typed instead of spreading the scale evenly.
      rubric = { ...rubric, rows: rubricRows };
      rubric = { ...rubric, floor: 0, ceiling: maxEarnable(rubric) };
    }
    const res = actions.createRubric(rubric);
    if (!res.ok) {
      onClose();
      onUpgrade(res.error);
      return;
    }
    toast("Custom rubric created");
    onClose();
    onCreated();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Build a rubric from scratch"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={build}>Use this rubric</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Rubric name" htmlFor="builder-name">
            <input id="builder-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Persuasive essay" />
          </Field>
        </div>
        <Field label="Levels" htmlFor="builder-cols">
          <input id="builder-cols" type="number" min={2} max={6} className={`${inputCls} w-20`} value={cols} onChange={(e) => resize(rows, parseInt(e.target.value, 10))} />
        </Field>
        <Field label="Criteria" htmlFor="builder-rows">
          <input id="builder-rows" type="number" min={1} max={12} className={`${inputCls} w-20`} value={rows} onChange={(e) => resize(parseInt(e.target.value, 10), cols)} />
        </Field>
      </div>
      <p className="mb-3 text-xs text-ink-3">Leave points blank to spread the scale evenly, or type your own points per level.</p>
      <div className="max-h-[48vh] overflow-auto rounded-lg border border-line">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-2 text-[11px] font-bold text-ink-2">
              <th className="min-w-32 border-b border-line px-2 py-2">Criteria</th>
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} className="border-b border-l border-line px-2 py-2">Level {c + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r} className="align-top">
                <td className="border-t border-line p-1.5">
                  <textarea aria-label={`Criteria ${r + 1}`} rows={2} className={`${inputCls} resize-none text-xs`} value={row.criteria} onChange={(e) => setGrid((g) => g.map((x, i) => (i === r ? { ...x, criteria: e.target.value } : x)))} placeholder="Criteria name" />
                </td>
                {row.cells.map((cell, c) => (
                  <td key={c} className="space-y-1 border-t border-l border-line p-1.5">
                    <input aria-label="Label" className={`${inputCls} py-1 text-xs`} placeholder="Label" value={cell.label} onChange={(e) => setCell(r, c, { label: e.target.value })} />
                    <input aria-label="Points" type="number" min={0} step={0.5} className={`${inputCls} w-20 py-1 text-xs`} placeholder="Pts" value={cell.pts} onChange={(e) => setCell(r, c, { pts: e.target.value })} />
                    <textarea aria-label="Description" rows={2} className={`${inputCls} resize-none text-xs`} placeholder="Description…" value={cell.desc} onChange={(e) => setCell(r, c, { desc: e.target.value })} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
