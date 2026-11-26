"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, Icon, IconButton, Modal, PageHeader, ProgressBar, inputCls } from "@/components/ui";
import { UpgradeModal } from "@/components/upgrade-modal";
import { blankRubric } from "@/lib/ai-mock";
import { fmtDate } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { fmt } from "@/lib/scoring";
import { actions, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Rubric } from "@/lib/types";

export function RubricLibrary() {
  const ws = useWorkspace();
  const router = useRouter();
  const { plan } = useSession();
  const limit = PLANS[plan].limits.rubrics;
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [toDelete, setToDelete] = useState<Rubric | null>(null);
  const [upgrade, setUpgrade] = useState<string | null>(null);

  const list = ws.rubrics.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  const open = (id: string) => {
    actions.setActiveRubric(id);
    router.push("/app/grade");
  };

  function create() {
    const res = actions.createRubric(blankRubric(newName.trim() || "Untitled rubric"));
    if (!res.ok) {
      setCreating(false);
      setUpgrade(res.error);
      return;
    }
    toast("Rubric created");
    setCreating(false);
    setNewName("");
    router.push("/app/grade");
  }

  return (
    <div>
      <PageHeader
        title="Rubric library"
        subtitle="Open a rubric to grade with it, duplicate it for next term, or start a new one."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New rubric
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
          <input aria-label="Search rubrics" className={`${inputCls} pl-9`} placeholder="Search rubrics" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {Number.isFinite(limit) && (
          <div className="w-52">
            <p className="mb-1 flex justify-between text-xs text-ink-2">
              <span>Saved rubrics</span>
              <span className="font-semibold">{ws.rubrics.length} / {limit}</span>
            </p>
            <ProgressBar value={ws.rubrics.length} max={limit} tone={ws.rubrics.length >= limit ? "bad" : "brand"} />
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="grid"
          title={query ? "No rubrics match your search" : "No rubrics yet"}
          body={query ? "Try a different word." : "Create your first rubric to start grading."}
          action={!query && <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New rubric</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const graded = ws.students.filter((s) => {
              const e = ws.grades[`${r.id}:${s.id}`];
              return e && r.rows.every((row) => e.ratings[row.id] !== undefined);
            }).length;
            const active = r.id === ws.activeRubricId;
            return (
              <Card key={r.id} className="group relative transition-shadow hover:shadow-pop">
                <button type="button" onClick={() => open(r.id)} className="block w-full text-left after:absolute after:inset-0 after:rounded-xl" aria-label={`Open ${r.name}`}>
                  <div className="flex items-start gap-2 pr-16">
                    <h3 className="font-display text-lg font-bold leading-snug">{r.name || "Untitled rubric"}</h3>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">{r.category}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge tone="brand">{r.rows.length} criteria</Badge>
                    <Badge tone="neutral">{r.rows[0]?.ratings.length ?? 0} levels</Badge>
                    <Badge tone="neutral">{r.type === "nopoints" ? "No points" : `${fmt(r.floor)}–${fmt(r.ceiling)}`}</Badge>
                    {active && <Badge tone="ok">Active</Badge>}
                  </div>
                  <p className="mt-4 text-xs text-ink-3">
                    {graded} of {ws.students.length} graded · Updated {r.updatedAt ? fmtDate(r.updatedAt) : "just now"}
                  </p>
                </button>
                <div className="absolute top-3 right-3 z-10 flex gap-0.5">
                  <IconButton
                    icon="copy"
                    label={`Duplicate ${r.name}`}
                    onClick={() => {
                      const res = actions.duplicateRubric(r.id);
                      if (!res.ok) setUpgrade(res.error);
                      else toast("Rubric duplicated");
                    }}
                  />
                  <IconButton icon="trash" label={`Delete ${r.name}`} className="hover:bg-bad-bg hover:text-bad" onClick={() => setToDelete(r)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New rubric"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" onClick={create}>Create</Button>
          </>
        }
      >
        <Field label="Rubric name" htmlFor="new-rubric">
          <input id="new-rubric" className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Persuasive essay, Q3" onKeyDown={(e) => e.key === "Enter" && create()} />
        </Field>
        <p className="mt-3 text-xs text-ink-3">You will get a blank three-level rubric to edit. Use Build or AI rubric on the grading screen for more control.</p>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete this rubric?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Keep it</Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (toDelete) actions.deleteRubric(toDelete.id);
                setToDelete(null);
                toast("Rubric deleted", "warn");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          <strong>{toDelete?.name}</strong> and every grade recorded with it will be removed. This cannot be undone.
        </p>
      </Modal>

      <UpgradeModal open={upgrade !== null} onClose={() => setUpgrade(null)} reason={upgrade ?? undefined} />
    </div>
  );
}
