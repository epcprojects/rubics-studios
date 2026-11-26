import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/pricing";
import { Icon } from "@/components/ui";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };

const ROWS: Array<{ label: string; free: string | boolean; pro: string | boolean }> = [
  { label: "Saved rubrics", free: `Up to ${PLANS.free.limits.rubrics}`, pro: "Unlimited" },
  { label: "Students", free: `Up to ${PLANS.free.limits.students}`, pro: "Unlimited" },
  { label: "Click-to-score grading", free: true, pro: true },
  { label: "Comment bank (English and Spanish)", free: true, pro: true },
  { label: "Print and CSV export", free: true, pro: true },
  { label: "AI rubric generator", free: false, pro: true },
  { label: "Upload a photo or PDF rubric", free: false, pro: true },
  { label: "Voice feedback", free: false, pro: true },
  { label: "Gradebook sync", free: false, pro: true },
  { label: "Saved to your account on any device", free: false, pro: true },
];

const FAQ = [
  { q: "Do I need an account to use the free plan?", a: "Yes, but it takes a minute and no card is needed. Sign in or create a free account and you can start grading right away." },
  { q: "What happens if I cancel Pro?", a: "You keep access until the end of the period you paid for. After that you move back to the Free plan and keep your account. Anything over the Free limits stays visible but you cannot add more until you are under them." },
  { q: "Can my school pay for several teachers?", a: "Not in this version. Tell us how many seats you need and we will add school plans." },
  { q: "Which gradebooks can I send grades to?", a: "PowerSchool, Illuminate and Google Classroom. On the Free plan you can export a CSV and enter grades by hand." },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Icon name="check" className="mx-auto size-4 text-ok" />;
  if (v === false) return <span className="text-ink-3">—</span>;
  return <span className="font-semibold">{v}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Simple pricing for teachers</h1>
        <p className="mt-3 text-ink-2">Start free. Upgrade when grading is your bottleneck.</p>
      </div>
      <PricingCards />

      <section className="mx-auto mt-20 max-w-3xl" aria-labelledby="compare">
        <h2 id="compare" className="mb-4 font-display text-2xl font-bold">Compare plans</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-3">
                <th className="px-4 py-3 font-bold">Feature</th>
                <th className="w-32 px-4 py-3 text-center font-bold">Free</th>
                <th className="w-32 px-4 py-3 text-center font-bold text-brand-600">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <th scope="row" className="px-4 py-3 text-left font-medium">{r.label}</th>
                  <td className="px-4 py-3 text-center"><Cell v={r.free} /></td>
                  <td className="px-4 py-3 text-center"><Cell v={r.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="mb-4 font-display text-2xl font-bold">Questions</h2>
        <div className="divide-y divide-line rounded-xl border border-line bg-surface shadow-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <Icon name="chevronDown" className="size-4 text-ink-3 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
