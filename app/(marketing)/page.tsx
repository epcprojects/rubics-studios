import { HeroMock } from "@/components/marketing/hero-mock";
import { PricingCards } from "@/components/marketing/pricing";
import { Badge, Icon, LinkButton, type IconName } from "@/components/ui";

const FEATURES: Array<{ icon: IconName; title: string; body: string; pro?: boolean }> = [
  { icon: "clipboard", title: "Click-to-score rubrics", body: "Tap a level for each criterion. Points, percentage and letter grade update as you go.", },
  { icon: "sliders", title: "Any scale you teach with", body: "0–10, 0–100, 50–100, percent ranges, or no points at all. Half-point steps when you need them." },
  { icon: "sparkles", title: "AI rubric generator", body: "Describe the assignment in a sentence and get a complete rubric to edit.", pro: true },
  { icon: "upload", title: "Upload an existing rubric", body: "Drop in a photo or PDF of the rubric you already use and get a live one back.", pro: true },
  { icon: "mic", title: "Voice feedback", body: "Record a quick note for a student instead of typing a paragraph.", pro: true },
  { icon: "send", title: "Send to your gradebook", body: "Push grades to PowerSchool, Illuminate or Google Classroom. Free users can export CSV.", pro: true },
];

const STEPS = [
  { n: "1", title: "Pick or build a rubric", body: "Start from a template, generate one, or build it cell by cell." },
  { n: "2", title: "Tap a level for each student", body: "Add comments from your bank in English or Spanish, or record a voice note." },
  { n: "3", title: "Send or export grades", body: "Review the class gradebook, then print, export CSV or sync it." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_70%_0%,var(--color-brand-100),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <Badge tone="brand" className="mb-5">
              <Icon name="sparkles" className="size-3" />
              Rubric grading for teachers
            </Badge>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              Grade with a click, not a weekend.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              Build or generate a rubric, tap a level for each criterion, and FlexGrades does the math, the letter grade and the feedback.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/login" variant="primary" size="lg">
                Try it free
                <Icon name="arrowRight" />
              </LinkButton>
              <LinkButton href="/pricing" variant="secondary" size="lg">
                See pricing
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-ink-3">Free forever. Pro adds AI rubrics, voice feedback and gradebook sync.</p>
          </div>
          <HeroMock />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Everything between “turned in” and “entered”</h2>
          <p className="mt-2 max-w-2xl text-ink-2">The free plan covers a full grading workflow. Pro removes the limits and automates the slow parts.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-xl border border-line bg-bg p-5 transition-shadow hover:shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name={f.icon} className="size-5" />
                  </span>
                  {f.pro && <Badge tone="pro">PRO</Badge>}
                </div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps per assignment</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-lg font-extrabold text-white">{s.n}</span>
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Free to grade. Pro to go faster.</h2>
            <p className="mt-2 text-ink-2">Start free with no card. Upgrade when you want the extras.</p>
          </div>
          <PricingCards />
        </div>
      </section>
    </>
  );
}
