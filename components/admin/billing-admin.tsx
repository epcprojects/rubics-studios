"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, PlanBadge, Segmented } from "@/components/ui";
import { lastMonths, mrrOf } from "@/lib/admin-stats";
import { downloadFile, fmtDate, fmtMoney, toCsv } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { actions, useDB } from "@/lib/store";
import { toast } from "@/lib/toast";

type Tab = "transactions" | "subscribers";
type Filter = "all" | "paid" | "refunded" | "failed";

export function BillingAdmin() {
  const db = useDB();
  const [tab, setTab] = useState<Tab>("transactions");
  const [filter, setFilter] = useState<Filter>("all");

  const nameOf = (id: string) => db.users.find((u) => u.id === id)?.name ?? "Deleted user";
  const mrr = mrrOf(db.users);
  const month = lastMonths(1)[0]!.key;
  const paid = db.transactions.filter((t) => t.status === "paid");
  const thisMonth = paid.filter((t) => t.createdAt.startsWith(month)).reduce((s, t) => s + t.amount, 0);
  const problems = db.transactions.filter((t) => t.status !== "paid").length;
  const lifetime = paid.reduce((s, t) => s + t.amount, 0);

  const txns = db.transactions.filter((t) => filter === "all" || t.status === filter);
  const subscribers = db.users
    .filter((u) => u.role === "teacher" && u.plan === "pro" && u.subscription)
    .sort((a, b) => a.subscription!.renewsAt.localeCompare(b.subscription!.renewsAt));

  function exportCsv() {
    downloadFile(
      "flexgrades_transactions.csv",
      toCsv([
        ["Transaction", "Date", "User", "Description", "Amount", "Status"],
        ...txns.map((t) => [t.id, t.createdAt.slice(0, 10), nameOf(t.userId), t.description, t.amount, t.status]),
      ]),
    );
    toast(`Exported ${txns.length} transactions`);
  }

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Every charge and every paying teacher."
        actions={<Button icon="download" onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="MRR" value={fmtMoney(Math.round(mrr * 100) / 100)} note={`${subscribers.length} paying teachers`} />
        <Stat label="ARR run rate" value={fmtMoney(Math.round(mrr * 12))} note="MRR × 12" />
        <Stat label="Revenue this month" value={fmtMoney(thisMonth)} note={`${fmtMoney(lifetime)} lifetime`} />
        <Stat label="Failed or refunded" value={String(problems)} note="Across all time" />
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "transactions", label: "Transactions" },
            { value: "subscribers", label: "Subscribers" },
          ]}
        />
        {tab === "transactions" && (
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "paid", label: "Paid" },
              { value: "refunded", label: "Refunded" },
              { value: "failed", label: "Failed" },
            ]}
          />
        )}
      </div>

      {tab === "transactions" ? (
        txns.length === 0 ? (
          <EmptyState icon="receipt" title="No transactions" body="Nothing matches this filter." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {txns.slice(0, 80).map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-4 py-2.5 text-ink-2">{fmtDate(t.createdAt)}</td>
                    <td className="px-4 py-2.5 font-semibold">{nameOf(t.userId)}</td>
                    <td className="px-4 py-2.5 text-ink-2">{t.description}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtMoney(t.amount)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={t.status === "paid" ? "ok" : t.status === "refunded" ? "warn" : "bad"}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {t.status === "paid" && (
                        <Button size="sm" variant="ghost" onClick={() => { actions.adminRefund(t.id); toast(`Refunded ${fmtMoney(t.amount)}`, "warn"); }}>
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : subscribers.length === 0 ? (
        <EmptyState icon="users" title="No subscribers yet" body="Teachers who upgrade to Pro will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Next date</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">MRR</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((u) => {
                const s = u.subscription!;
                const m = s.interval === "annual" ? PLANS.pro.price.annual / 12 : PLANS.pro.price.monthly;
                return (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-4 py-2.5">
                      <span className="block font-semibold">{u.name}</span>
                      <span className="block text-xs text-ink-3">{u.email}</span>
                    </td>
                    <td className="px-4 py-2.5"><PlanBadge plan="pro" /></td>
                    <td className="px-4 py-2.5">{s.interval === "annual" ? "Yearly" : "Monthly"}</td>
                    <td className="px-4 py-2.5 text-ink-2">{fmtDate(s.startedAt)}</td>
                    <td className="px-4 py-2.5 text-ink-2">{fmtDate(s.renewsAt)}</td>
                    <td className="px-4 py-2.5">
                      {u.status === "suspended" ? <Badge tone="bad">Suspended</Badge> : s.cancelAtPeriodEnd ? <Badge tone="warn">Cancelling</Badge> : <Badge tone="ok">Active</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtMoney(Math.round(m * 100) / 100)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{label}</p>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{note}</p>
    </Card>
  );
}
