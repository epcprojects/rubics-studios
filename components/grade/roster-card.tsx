"use client";

import { useState } from "react";
import { Button, Card, CardTitle, Field, IconButton, Modal, ProgressBar, Segmented, cx, inputCls } from "@/components/ui";
import { computeScore, fmt } from "@/lib/scoring";
import { actions } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Rubric, Student, Workspace } from "@/lib/types";

const COLORS = ["#4f46e5", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#db2777", "#ea580c"];

export function RosterCard({
  ws,
  rubric,
  activeId,
  onUpgrade,
}: {
  ws: Workspace;
  rubric: Rubric;
  activeId: string | null;
  onUpgrade: (reason: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  let graded = 0;
  const rows = ws.students.map((s, i) => {
    const entry = ws.grades[`${rubric.id}:${s.id}`];
    const score = computeScore(rubric, entry);
    const done = score.complete;
    if (done) graded++;
    return { s, i, score, status: done ? "done" : score.scored > 0 ? "pending" : "none" } as const;
  });

  return (
    <>
      <Card>
        <CardTitle action={<Button size="sm" variant="secondary" icon="plus" onClick={() => setAddOpen(true)}>Add</Button>}>
          Students
        </CardTitle>
        <ul className="-mx-1 max-h-[340px] space-y-0.5 overflow-y-auto px-1">
          {rows.map(({ s, i, score, status }) => {
            const c = COLORS[i % COLORS.length]!;
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <div
                  className={cx(
                    "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                    active ? "bg-brand-50" : "hover:bg-surface-2",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => actions.setActiveStudent(s.id)}
                    aria-current={active ? "true" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold" style={{ background: `${c}1f`, color: c }}>
                      {s.num}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx("block truncate text-sm font-semibold", active && "text-brand-700")}>Student {s.num}</span>
                      <span className="block truncate text-[11px] text-ink-3">
                        {s.initials || "no initials"}
                        {score.total !== null && rubric.type !== "nopoints" && (
                          <span className="ml-1.5 font-bold text-brand-600">
                            {fmt(score.total)}/{fmt(rubric.ceiling)}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <IconButton icon="edit" label={`Edit student ${s.num}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100" onClick={() => setEditing(s)} />
                  <span
                    title={status === "done" ? "Graded" : status === "pending" ? "In progress" : "Not started"}
                    className={cx("size-2 shrink-0 rounded-full", status === "done" ? "bg-ok" : status === "pending" ? "bg-warn" : "bg-line")}
                  />
                </div>
              </li>
            );
          })}
          {rows.length === 0 && <li className="py-6 text-center text-sm text-ink-3">No students yet. Add your class to start grading.</li>}
        </ul>
      </Card>

      <Card>
        <CardTitle>Progress</CardTitle>
        <ProgressBar value={graded} max={ws.students.length} />
        <p className="mt-2 text-xs text-ink-3">
          {graded} of {ws.students.length} graded
        </p>
      </Card>

      <AddStudentsModal open={addOpen} onClose={() => setAddOpen(false)} onUpgrade={onUpgrade} />
      <EditStudentModal key={editing?.id ?? "none"} student={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function AddStudentsModal({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: (reason: string) => void }) {
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [count, setCount] = useState("");
  const [start, setStart] = useState("1");
  const [num, setNum] = useState("");
  const [initials, setInitials] = useState("");

  function submit() {
    let list: Array<{ num: number; initials: string }> = [];
    if (mode === "bulk") {
      const n = parseInt(count, 10);
      const s = parseInt(start, 10) || 1;
      if (!n || n < 1) return;
      list = Array.from({ length: Math.min(n, 300) }, (_, i) => ({ num: s + i, initials: "" }));
    } else {
      const n = parseInt(num, 10);
      if (!n) return;
      list = [{ num: n, initials: initials.trim() }];
    }
    const res = actions.addStudents(list);
    if (!res.ok) {
      onClose();
      onUpgrade(res.error);
      return;
    }
    toast(res.data === 1 ? "Student added" : `${res.data} students added`);
    setCount("");
    setNum("");
    setInitials("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add students"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{mode === "bulk" ? "Add all" : "Add student"}</Button>
        </>
      }
    >
      <Segmented
        value={mode}
        onChange={setMode}
        className="mb-4 w-full"
        options={[
          { value: "bulk", label: "Bulk add" },
          { value: "single", label: "Single" },
        ]}
      />
      {mode === "bulk" ? (
        <div className="space-y-3">
          <Field label="How many students?" htmlFor="bulk-count">
            <input id="bulk-count" type="number" min={1} className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} placeholder="e.g. 28" />
          </Field>
          <Field label="Starting number" htmlFor="bulk-start" hint="Creates Student 1 through Student N. Add initials afterward.">
            <input id="bulk-start" type="number" min={1} className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Student number" htmlFor="single-num">
            <input id="single-num" type="number" className={inputCls} value={num} onChange={(e) => setNum(e.target.value)} placeholder="e.g. 7" />
          </Field>
          <Field label="Initials (optional)" htmlFor="single-init">
            <input id="single-init" maxLength={5} className={inputCls} value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. t.s" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function EditStudentModal({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const [num, setNum] = useState(String(student?.num ?? ""));
  const [initials, setInitials] = useState(student?.initials ?? "");
  if (!student) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit student"
      footer={
        <>
          <Button
            variant="danger"
            icon="trash"
            className="mr-auto"
            onClick={() => {
              actions.deleteStudent(student.id);
              toast(`Student ${student.num} removed`, "warn");
              onClose();
            }}
          >
            Remove
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              const n = parseInt(num, 10);
              if (!n) return;
              actions.updateStudent(student.id, { num: n, initials: initials.trim() });
              toast("Student updated");
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Student number" htmlFor="edit-num">
          <input id="edit-num" type="number" className={inputCls} value={num} onChange={(e) => setNum(e.target.value)} />
        </Field>
        <Field label="Initials" htmlFor="edit-init">
          <input id="edit-init" maxLength={5} className={inputCls} value={initials} onChange={(e) => setInitials(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
