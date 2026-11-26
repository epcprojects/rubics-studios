"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, PageHeader, ProgressBar, type IconName } from "@/components/ui";
import { PaperArt } from "@/components/paper-art";
import { blankRubric } from "@/lib/ai-mock";
import { fmtDateTime } from "@/lib/format";
import { computeScore } from "@/lib/scoring";
import { actions, useDB, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";

const TIPS = [
  { title: "Feedback that looks forward.", body: "Pair one thing a student did well with one specific next step. A little direction goes a long way." },
];

export function Overview() {
  const router = useRouter();
  const db = useDB();
  const ws = useWorkspace();
  const { user, ownerId } = useSession();

  const first = (user?.name ?? ws.teacherName).replace(/^(ms|mr|mrs|dr)\.?\s+/i, "").split(" ")[0];

  const perRubric = ws.rubrics.map((r) => {
    const graded = ws.students.filter((s) => computeScore(r, ws.grades[`${r.id}:${s.id}`]).complete).length;
    return { r, graded };
  });
  const totalGraded = perRubric.reduce((t, x) => t + x.graded, 0);
  const active = perRubric.find((x) => x.r.id === ws.activeRubricId) ?? perRubric[0];
  const awaiting = active ? Math.max(0, ws.students.length - active.graded) : 0;
  const events = db.activity.filter((e) => e.userId === ownerId).slice(0, 4);

  const open = (id: string) => {
    actions.setActiveRubric(id);
    router.push("/app/grade");
  };

  function createBlank() {
    const res = actions.createRubric(blankRubric("Untitled rubric"));
    if (!res.ok) return toast(res.error, "warn");
    router.push("/app/grade");
  }

  return (
    <div>
      <PageHeader
        title="A little clarity for your classroom."
        subtitle={`Welcome back, ${first}. Let's make room for good feedback.`}
        actions={
          <Button variant="primary" icon="plus" onClick={createBlank}>
            Create rubric
          </Button>
        }
      />

      <section className="mb-6 grid overflow-hidden rounded-[13px] border border-[#dfe7d8] bg-[#eaf0e4] md:grid-cols-[1fr_300px]">
        <div className="p-7 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Your next good lesson starts here</p>
          <h2 className="mt-2.5 mb-2 font-display text-4xl leading-tight">Fair grades. Thoughtful feedback.</h2>
          <p className="max-w-md text-sm text-[#60735f]">Build a rubric that makes expectations clear, then give every student a meaningful next step.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/app/grade" className="inline-flex h-10 items-center gap-2 rounded-[7px] border border-[#bdcdb3] px-4 text-xs font-medium text-brand-600 hover:bg-white/60">
              <Icon name="arrowRight" className="size-4" />
              Continue grading
            </Link>
            <Link href="/app/rubrics" className="inline-flex h-10 items-center gap-2 rounded-[7px] px-3 text-xs font-medium text-brand-600 hover:bg-white/60">
              Browse rubrics
            </Link>
          </div>
        </div>
        <div className="relative hidden md:block">
          <PaperArt />
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric icon="clipboard" label="My rubrics" value={ws.rubrics.length} foot="Ready for your next lesson" />
        <Metric icon="users" label="Students" value={ws.students.length} foot="In your classroom" />
        <Metric icon="check" label="Graded assignments" value={totalGraded} foot="Across all your rubrics" />
        <Metric icon="clock" label="Awaiting feedback" value={awaiting} foot={active ? active.r.name : "No rubric yet"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Pick up where you left off</h2>
            <Link href="/app/rubrics" className="text-xs font-medium text-brand-600 hover:underline">
              All rubrics ↗
            </Link>
          </div>
          <div className="overflow-x-auto rounded-[10px] border border-line bg-surface">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-[10px] font-medium uppercase tracking-[0.6px] text-ink-3">
                  <th className="px-5 py-3">Rubric</th>
                  <th className="px-5 py-3">Grading</th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {perRubric.slice(0, 4).map(({ r, graded }) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-brand-50/50">
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => open(r.id)} className="flex items-center gap-3 text-left">
                        <span className="grid size-9 place-items-center rounded-md bg-brand-50 text-brand-600">
                          <Icon name="clipboard" className="size-[18px]" />
                        </span>
                        <span>
                          <span className="block font-medium">{r.name || "Untitled rubric"}</span>
                          <span className="block text-[11px] text-ink-3">
                            {r.category} · {r.rows.length} criteria
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs">
                        {graded}/{ws.students.length}
                      </span>
                      <div className="mt-1.5 w-20">
                        <ProgressBar value={graded} max={Math.max(1, ws.students.length)} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" aria-label={`Open ${r.name}`} onClick={() => open(r.id)} className="rounded-md p-1.5 text-brand-600 hover:bg-brand-50">
                        <Icon name="arrowRight" className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {perRubric.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-ink-3">
                      No rubrics yet. Create your first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 mb-4 font-display text-2xl">Quick start</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Quick href="/app/grade" icon="clipboard" title="Grade students" body="Pick a student and click a level for each criterion." tone="#b8cba6" />
            <Quick href="/app/rubrics" icon="grid" title="Rubric library" body="Search, duplicate or start a new rubric." tone="#b5ccd3" />
            <Quick href="/app/gradebook" icon="chart" title="Gradebook" body="See the whole class, export or print." tone="#e5c7a8" />
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <h2 className="mb-4 font-display text-2xl">Classroom activity</h2>
            <Card className="p-5">
              {events.length === 0 ? (
                <ul className="space-y-5">
                  {["Your teacher workspace is ready.", "Starter rubrics added to your library.", "Sample classroom created with students."].map((t, i) => (
                    <ActivityRow key={t} text={t} meta="Getting started" first={i === 0} />
                  ))}
                </ul>
              ) : (
                <ul className="space-y-5">
                  {events.map((e, i) => (
                    <ActivityRow key={e.id} text={e.text} meta={fmtDateTime(e.at)} first={i === 0} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <div className="rounded-[10px] border border-[#eae3d3] bg-[#f4efe4] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#a78c60]">A small teaching tip</p>
            <h3 className="mt-2 font-display text-2xl">{TIPS[0]!.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#8b806b]">{TIPS[0]!.body}</p>
            <Link href="/app/grade" className="mt-3 inline-block text-xs font-medium text-[#8b7450] hover:underline">
              Open comment bank ↗
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, foot }: { icon: IconName; label: string; value: number; foot: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between text-xs text-ink-3">
        {label}
        <Icon name={icon} className="size-[18px] text-[#72926b]" />
      </div>
      <p className="mt-3 text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 truncate text-[11px] text-ink-3">{foot}</p>
    </div>
  );
}

function Quick({ href, icon, title, body, tone }: { href: string; icon: IconName; title: string; body: string; tone: string }) {
  return (
    <Link href={href} className="group rounded-[9px] border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand-200">
      <div className="mb-4 flex items-end justify-between">
        <div className="flex h-14 items-end gap-1" aria-hidden>
          {[24, 39, 31, 52, 44].map((h, i) => (
            <i key={i} className="block w-3 rounded-t-[3px]" style={{ height: h, background: tone }} />
          ))}
        </div>
        <Icon name={icon} className="size-5 text-brand-600 transition group-hover:translate-x-0.5" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-3">{body}</p>
    </Link>
  );
}

function ActivityRow({ text, meta, first }: { text: string; meta: string; first: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf2e8] text-[#7f9b6a]">
        <Icon name={first ? "check" : "clipboard"} className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs leading-snug">{text}</span>
        <span className="mt-1 block text-[10px] text-ink-3">{meta}</span>
      </span>
    </li>
  );
}
