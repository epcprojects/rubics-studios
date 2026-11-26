"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, GradePill, Icon, PageHeader, cx, inputCls } from "@/components/ui";
import { UpgradeModal } from "@/components/upgrade-modal";
import { downloadFile, toCsv } from "@/lib/format";
import { GRADEBOOKS } from "@/lib/plans";
import { computeScore, fmt } from "@/lib/scoring";
import { actions, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";

export function GradebookView() {
  const ws = useWorkspace();
  const { isPro } = useSession();
  const [rubricId, setRubricId] = useState<string | null>(null);
  const [target, setTarget] = useState<string>(GRADEBOOKS[0]);
  const [upgrade, setUpgrade] = useState<string | null>(null);

  const rubric = ws.rubrics.find((r) => r.id === (rubricId ?? ws.activeRubricId)) ?? ws.rubrics[0];
  if (!rubric) {
    return <EmptyState icon="chart" title="No rubrics yet" body="Create a rubric and grade a few students to see the gradebook." />;
  }

  const rows = ws.students.map((s) => {
    const entry = ws.grades[`${rubric.id}:${s.id}`];
    return { s, entry, score: computeScore(rubric, entry) };
  });
  const graded = rows.filter((r) => r.score.complete && r.score.pct !== null);
  const avg = graded.length ? Math.round(graded.reduce((t, r) => t + (r.score.pct ?? 0), 0) / graded.length) : null;
  const dist = (["A", "B", "C", "D", "F"] as const).map((g) => ({ g, n: graded.filter((r) => r.score.grade === g).length }));
  const maxN = Math.max(1, ...dist.map((d) => d.n));
  const synced = rows.filter((r) => r.entry?.syncedTo).length;

  function csv() {
    const out = toCsv([
      ["Student", "Initials", `${rubric!.name} score`, "Percent", "Grade", "Comment"],
      ...rows.map((r) => [
        `Student ${r.s.num}`,
        r.s.initials,
        r.score.total === null ? "" : fmt(r.score.total),
        r.score.pct === null ? "" : `${r.score.pct}%`,
        r.score.grade ?? "",
        r.entry?.comment ?? "",
      ]),
    ]);
    downloadFile(`FlexGrades_${rubric!.name.replace(/\W+/g, "_")}.csv`, out);
    toast("CSV downloaded");
  }

  function sync() {
    if (!isPro) return setUpgrade("Gradebook sync is a Pro feature. Download the CSV to enter grades yourself.");
    if (graded.length === 0) return toast("Nothing to send yet", "warn");
    const res = actions.syncGrades(rubric!.id, graded.map((r) => r.s.id), target);
    if (res.ok) toast(`Sent ${res.data} grades to ${target}`);
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Gradebook"
          subtitle="Every student for one rubric, ready to print, export or send."
          actions={
            <>
              <Button icon="printer" onClick={() => window.print()}>Print</Button>
              <Button icon="download" onClick={csv}>Download CSV</Button>
            </>
          }
        />
      </div>
      <div className="print-only mb-4">
        <h1 className="font-display text-2xl font-extrabold">{rubric.name}: gradebook</h1>
        <p className="text-sm">{ws.teacherName}</p>
      </div>

      <div className="no-print mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Class average" value={avg === null ? "–" : `${avg}%`} />
          <Stat label="Graded" value={`${graded.length} of ${ws.students.length}`} />
          <Stat label="Sent to gradebook" value={String(synced)} />
          <Card className="sm:col-span-3">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-3">Grade distribution</p>
            <div className="flex h-24 items-end gap-3" role="img" aria-label={dist.map((d) => `${d.g}: ${d.n}`).join(", ")}>
              {dist.map((d) => (
                <div key={d.g} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-ink-2">{d.n}</span>
                  <div className="w-full max-w-14 rounded-t-lg bg-sage" style={{ height: `${Math.max(4, (d.n / maxN) * 64)}px`, opacity: d.n ? 1 : 0.25 }} />
                  <span className="text-xs font-bold">{d.g}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-3">Rubric</p>
          <select aria-label="Rubric" className={inputCls} value={rubric.id} onChange={(e) => setRubricId(e.target.value)}>
            {ws.rubrics.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <p className="mt-4 mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
            Send grades {!isPro && <Badge tone="pro">PRO</Badge>}
          </p>
          <select aria-label="Gradebook" className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
            {GRADEBOOKS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <Button variant={isPro ? "success" : "pro"} icon={isPro ? "send" : "lock"} className="mt-3 w-full" onClick={sync}>
            {isPro ? `Send ${graded.length} grades` : "Upgrade to sync"}
          </Button>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-[10px] font-medium uppercase tracking-[0.6px] text-ink-3">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">%</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Comment</th>
              <th className="no-print px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, entry, score }) => (
              <tr key={s.id} className="border-t border-line hover:bg-surface-2">
                <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                  Student {s.num} {s.initials && <span className="font-normal text-ink-3">({s.initials})</span>}
                </th>
                <td className="px-4 py-2.5 font-bold text-brand-600">{score.total === null ? "—" : `${fmt(score.total)} / ${fmt(rubric.ceiling)}`}</td>
                <td className="px-4 py-2.5">{score.pct === null ? "—" : `${score.pct}%`}</td>
                <td className="px-4 py-2.5"><GradePill grade={score.grade} /></td>
                <td className="max-w-xs truncate px-4 py-2.5 text-ink-2">{entry?.comment || <span className="text-ink-3">—</span>}</td>
                <td className="no-print px-4 py-2.5">
                  {entry?.syncedTo ? (
                    <Badge tone="ok"><Icon name="check" className="size-3" />Sent to {entry.syncedTo}</Badge>
                  ) : score.complete ? (
                    <Badge tone="brand">Ready</Badge>
                  ) : score.scored > 0 ? (
                    <Badge tone="warn">In progress</Badge>
                  ) : (
                    <span className="text-ink-3">Not started</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-3">No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-3">
        {avg === null ? "No grades recorded yet." : `Class average ${avg}% across ${graded.length} graded students.`}
      </p>

      <UpgradeModal open={upgrade !== null} onClose={() => setUpgrade(null)} reason={upgrade ?? undefined} />
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card className={cx(className)}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
    </Card>
  );
}
