"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Icon, IconButton, LinkButton, cx } from "@/components/ui";
import { UpgradeModal } from "@/components/upgrade-modal";
import { blankRubric } from "@/lib/ai-mock";
import { computeScore, fmt } from "@/lib/scoring";
import { actions, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { GradeEntry } from "@/lib/types";
import { AssignmentCard } from "./assignment-card";
import { FeedbackPanel } from "./feedback-panel";
import { AIDialog, BuilderDialog, UploadDialog } from "./rubric-dialogs";
import { RosterCard } from "./roster-card";
import { RubricTable } from "./rubric-table";
import { ScoreBanner } from "./score-banner";

type Dialog = "ai" | "upload" | "builder" | null;

export function GradeWorkspace() {
  const ws = useWorkspace();
  const { isPro } = useSession();
  const [edit, setEdit] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [upgrade, setUpgrade] = useState<string | null>(null);

  const rubric = ws.rubrics.find((r) => r.id === ws.activeRubricId) ?? ws.rubrics[0];

  if (!rubric) {
    return (
      <>
        <EmptyState
          icon="clipboard"
          title="No rubrics yet"
          body="Create a rubric to start grading."
          action={
            <Button
              variant="primary"
              icon="plus"
              onClick={() => {
                const res = actions.createRubric(blankRubric("Untitled rubric"));
                if (!res.ok) setUpgrade(res.error);
                else setEdit(true);
              }}
            >
              New rubric
            </Button>
          }
        />
        <UpgradeModal open={upgrade !== null} onClose={() => setUpgrade(null)} reason={upgrade ?? undefined} />
      </>
    );
  }

  const idx = Math.max(0, ws.students.findIndex((s) => s.id === ws.activeStudentId));
  const student = ws.students[idx];
  const entry: GradeEntry | undefined = student ? ws.grades[`${rubric.id}:${student.id}`] : undefined;
  const score = computeScore(rubric, entry);
  const gradedIds = ws.students.filter((s) => computeScore(rubric, ws.grades[`${rubric.id}:${s.id}`]).complete).map((s) => s.id);
  const step = rubric.halfPoints ? 0.5 : 1;
  const bonus = entry?.bonus ?? 0;

  const requirePro = (reason: string, d: Dialog) => {
    if (!isPro) setUpgrade(reason);
    else setDialog(d);
  };

  const select = (rowId: string, i: number) => {
    if (!student) return toast("Add a student first", "warn");
    actions.updateGrade(rubric.id, student.id, (e) => {
      const sliders = { ...e.sliders };
      delete sliders[rowId];
      return { ...e, ratings: { ...e.ratings, [rowId]: i }, sliders };
    });
  };
  const slide = (rowId: string, v: number) => {
    if (!student) return;
    actions.updateGrade(rubric.id, student.id, (e) => ({ ...e, sliders: { ...e.sliders, [rowId]: v } }));
  };
  const adjustBonus = (dir: 1 | -1) => {
    if (!student) return;
    actions.updateGrade(rubric.id, student.id, (e) => ({ ...e, bonus: Math.round((e.bonus + dir * step) * 10) / 10 }));
  };
  const go = (to: number) => {
    const s = ws.students[to];
    if (s) actions.setActiveStudent(s.id);
  };
  const duplicate = () => {
    const res = actions.duplicateRubric(rubric.id);
    if (!res.ok) setUpgrade(res.error);
    else toast("Rubric duplicated");
  };

  const studentLabel = student ? `Student ${student.num}${student.initials ? ` (${student.initials})` : ""}` : "No student selected";

  return (
    <div>
      {/* toolbar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative">
            <label htmlFor="rubric-switch" className="sr-only">Active rubric</label>
            <select
              id="rubric-switch"
              value={rubric.id}
              onChange={(e) => actions.setActiveRubric(e.target.value)}
              className="max-w-[16rem] appearance-none truncate rounded-lg border border-line bg-surface py-2 pr-9 pl-3 font-display text-lg font-extrabold tracking-tight outline-none focus:border-brand-600 sm:max-w-sm sm:text-xl"
            >
              {ws.rubrics.map((r) => (
                <option key={r.id} value={r.id}>{r.name || "Untitled rubric"}</option>
              ))}
            </select>
            <Icon name="chevronDown" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
          </div>
          {edit && <Badge tone="warn"><Icon name="edit" className="size-3" />Editing</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" icon="sparkles" onClick={() => requirePro("The AI rubric generator is a Pro feature.", "ai")}>
            AI rubric{!isPro && <Icon name="lock" className="size-3 text-ink-3" />}
          </Button>
          <Button size="sm" icon="upload" onClick={() => requirePro("Uploading a rubric is a Pro feature.", "upload")}>
            Upload{!isPro && <Icon name="lock" className="size-3 text-ink-3" />}
          </Button>
          <Button size="sm" icon="grid" onClick={() => setDialog("builder")}>Build</Button>
          <Button size="sm" variant={edit ? "primary" : "secondary"} icon={edit ? "check" : "edit"} onClick={() => { setEdit((e) => !e); toast(edit ? "Edit mode off" : "Edit any cell of the rubric", edit ? "ok" : "warn"); }}>
            {edit ? "Done editing" : "Edit rubric"}
          </Button>
          <Button size="sm" icon="printer" onClick={() => window.print()}>Print</Button>
          <LinkButton size="sm" href="/app/gradebook" icon="chart">Gradebook</LinkButton>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[264px_minmax(0,1fr)_304px]">
        {/* left */}
        <div className="no-print order-2 space-y-4 xl:order-1">
          <RosterCard ws={ws} rubric={rubric} activeId={student?.id ?? null} onUpgrade={setUpgrade} />
          <AssignmentCard rubric={rubric} onDuplicate={duplicate} />
        </div>

        {/* centre */}
        <main className="order-1 min-w-0 space-y-3 xl:order-2">
          <div className="print-only mb-2">
            <h1 className="font-display text-2xl font-extrabold">{rubric.name}</h1>
            <p className="text-sm text-ink-2">{studentLabel} · {rubric.category} · {ws.teacherName}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Now grading</p>
              <h2 className="font-display text-3xl leading-tight">{studentLabel}</h2>
              <p className="text-xs text-ink-3">
                {idx + 1} of {ws.students.length} students
              </p>
            </div>
            <div className="no-print flex items-center gap-1.5">
              <Button size="sm" icon="refresh" disabled={!student} onClick={() => student && actions.clearGrade(rubric.id, student.id)}>Clear</Button>
              <Button size="sm" icon="chevronLeft" disabled={idx <= 0} onClick={() => go(idx - 1)}>Prev</Button>
              <Button size="sm" disabled={idx >= ws.students.length - 1} onClick={() => go(idx + 1)}>
                Next<Icon name="chevronRight" className="size-3.5" />
              </Button>
            </div>
          </div>

          <ScoreBanner rubric={rubric} score={score} />

          {!student && (
            <p className="no-print rounded-lg bg-warn-bg px-4 py-3 text-sm font-medium text-warn">
              Add students from the list on the left to start scoring.
            </p>
          )}

          <RubricTable
            rubric={rubric}
            entry={entry}
            editMode={edit}
            onSelect={select}
            onSlider={slide}
            onChange={(fn) => actions.updateRubric(rubric.id, fn)}
          />

          <div className="print-only text-sm">
            {entry?.comment && <p><strong>Comment:</strong> {entry.comment}</p>}
          </div>

          <Card className={cx("no-print flex flex-wrap items-center gap-3", edit && "opacity-50")}>
            <span className="text-sm font-semibold">Extra / deduction</span>
            <div className="flex items-center gap-1.5">
              <IconButton icon="minus" label="Deduct" className="border border-line" onClick={() => adjustBonus(-1)} disabled={!student || edit} />
              <span className="min-w-10 text-center font-display text-xl font-extrabold text-brand-600">{bonus > 0 ? `+${fmt(bonus)}` : fmt(bonus)}</span>
              <IconButton icon="plus" label="Add" className="border border-line" onClick={() => adjustBonus(1)} disabled={!student || edit} />
            </div>
            <span className="text-xs text-ink-3">Late work, extra credit, and so on.</span>
          </Card>
        </main>

        {/* right */}
        <div className="no-print order-3 space-y-4">
          <FeedbackPanel ws={ws} rubric={rubric} student={student} entry={entry} isPro={isPro} gradedIds={gradedIds} onUpgrade={setUpgrade} />
        </div>
      </div>

      <AIDialog open={dialog === "ai"} onClose={() => setDialog(null)} onUpgrade={setUpgrade} onCreated={() => setEdit(false)} />
      <UploadDialog open={dialog === "upload"} onClose={() => setDialog(null)} onUpgrade={setUpgrade} onCreated={() => setEdit(false)} />
      <BuilderDialog key={dialog === "builder" ? "open" : "closed"} open={dialog === "builder"} onClose={() => setDialog(null)} onUpgrade={setUpgrade} onCreated={() => setEdit(false)} />
      <UpgradeModal open={upgrade !== null} onClose={() => setUpgrade(null)} reason={upgrade ?? undefined} />
      <p className="no-print mt-6 text-center text-xs text-ink-3">
        Need to see every rubric? <Link href="/app/rubrics" className="font-semibold text-brand-600 hover:underline">Open your rubric library</Link>
      </p>
    </div>
  );
}
