"use client";

import Link from "next/link";
import { Card, CardTitle, Icon, PageHeader, PlanBadge, type IconName } from "@/components/ui";
import { lastMonths, mrrOf, revenueByMonth, signupsByMonth } from "@/lib/admin-stats";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { useDB } from "@/lib/store";
import type { ActivityEvent } from "@/lib/types";
import { BarChart, Legend } from "./charts";

const EVENT_ICON: Record<ActivityEvent["type"], IconName> = {
  signup: "user",
  login: "logout",
  upgrade: "star",
  cancel: "ban",
  resume: "refresh",
  rubric: "clipboard",
  ai: "sparkles",
  sync: "send",
  admin: "shield",
};

export function AdminOverview() {
  const db = useDB();
  const teachers = db.users.filter((u) => u.role === "teacher");
  const pro = teachers.filter((u) => u.plan === "pro" && u.status === "active");
  const mrr = mrrOf(db.users);
  const months = lastMonths(9);
  const signups = signupsByMonth(db.users, months);
  const revenue = revenueByMonth(db, months);
  const thisMonth = months[months.length - 1]!.key;
  const newThisMonth = teachers.filter((u) => u.createdAt.startsWith(thisMonth)).length;
  const conversion = teachers.length ? Math.round((pro.length / teachers.length) * 100) : 0;
  const recent = [...teachers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const freeN = teachers.length - teachers.filter((u) => u.plan === "pro").length;
  const proN = teachers.length - freeN;

  return (
    <div>
      <PageHeader title="Overview" subtitle="Who is using FlexGrades, who is paying, and what changed lately." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="users" label="Teachers" value={String(teachers.length)} note={`${newThisMonth} new this month`} />
        <Kpi icon="star" label="Pro subscribers" value={String(pro.length)} note={`${conversion}% of teachers`} />
        <Kpi icon="trendUp" label="Monthly recurring revenue" value={fmtMoney(Math.round(mrr * 100) / 100)} note={`${fmtMoney(Math.round(mrr * 12))} a year`} />
        <Kpi icon="receipt" label="Revenue this month" value={fmtMoney(revenue[revenue.length - 1]!)} note="Paid charges only" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>New teachers per month</CardTitle>
          <BarChart
            data={months.map((m, i) => ({
              label: m.label,
              parts: [
                { name: "Free", value: signups[i]!.total - signups[i]!.pro, className: "bg-brand-200" },
                { name: "Pro", value: signups[i]!.pro, className: "bg-accent" },
              ],
            }))}
          />
          <div className="mt-4"><Legend items={[{ label: "Free", className: "bg-brand-200" }, { label: "Pro", className: "bg-accent" }]} /></div>
        </Card>
        <Card className="p-5">
          <CardTitle>Revenue per month</CardTitle>
          <BarChart
            data={months.map((m, i) => ({ label: m.label, parts: [{ name: "Revenue", value: revenue[i]!, className: "bg-brand-600" }] }))}
            format={(n) => fmtMoney(n)}
          />
          <p className="mt-4 text-xs text-ink-3">Annual plans count in the month they are paid.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <CardTitle action={<Link href="/admin/users" className="text-xs font-semibold text-brand-600 hover:underline">All users</Link>}>Newest teachers</CardTitle>
          <div className="mb-4">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${proN} Pro, ${freeN} Free`}>
              <div className="bg-accent" style={{ width: `${teachers.length ? (proN / teachers.length) * 100 : 0}%` }} />
              <div className="bg-brand-200" style={{ width: `${teachers.length ? (freeN / teachers.length) * 100 : 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-3">{proN} Pro · {freeN} Free</p>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{u.name.replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "")[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{u.name}</span>
                  <span className="block truncate text-xs text-ink-3">{u.school || u.email}</span>
                </span>
                <PlanBadge plan={u.plan} />
                <span className="hidden text-xs text-ink-3 sm:block">{fmtDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <CardTitle>Recent activity</CardTitle>
          <ul className="space-y-3">
            {db.activity.slice(0, 9).map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2">
                  <Icon name={EVENT_ICON[e.type]} className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{e.text}</span>
                  <span className="block text-xs text-ink-3">{fmtDateTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, note }: { icon: IconName; label: string; value: string; note: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{note}</p>
    </Card>
  );
}
