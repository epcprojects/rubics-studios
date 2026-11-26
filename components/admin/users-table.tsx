"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Icon, Modal, PageHeader, PlanBadge, Segmented, cx, inputCls } from "@/components/ui";
import { usageOf } from "@/lib/admin-stats";
import { downloadFile, fmtDate, fmtDateTime, fmtMoney, toCsv } from "@/lib/format";
import { actions, useDB } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";

type PlanFilter = "all" | "free" | "pro";
type Sort = "newest" | "name" | "active" | "graded";

export function UsersTable() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [openId, setOpenId] = useState<string | null>(null);

  const teachers = db.users.filter((u) => u.role === "teacher");
  const needle = q.trim().toLowerCase();
  const list = teachers
    .filter((u) => (plan === "all" ? true : u.plan === plan))
    .filter((u) => !needle || `${u.name} ${u.email} ${u.school}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "active") return b.lastActiveAt.localeCompare(a.lastActiveAt);
      if (sort === "graded") return usageOf(db, b).graded - usageOf(db, a).graded;
      return b.createdAt.localeCompare(a.createdAt);
    });

  function exportCsv() {
    const rows = list.map((u) => {
      const use = usageOf(db, u);
      return [u.name, u.email, u.school, u.plan, u.status, u.subscription?.interval ?? "", u.createdAt.slice(0, 10), u.lastActiveAt.slice(0, 10), use.rubrics, use.students, use.graded];
    });
    downloadFile("flexgrades_users.csv", toCsv([["Name", "Email", "School", "Plan", "Status", "Billing", "Joined", "Last active", "Rubrics", "Students", "Graded"], ...rows]));
    toast(`Exported ${rows.length} users`);
  }

  const selected = openId ? (db.users.find((u) => u.id === openId) ?? null) : null;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${teachers.length} teacher accounts. Open one to see their plan, usage and payments.`}
        actions={<Button icon="download" onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
          <input aria-label="Search users" className={`${inputCls} pl-9`} placeholder="Search name, email or school" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Segmented
          value={plan}
          onChange={setPlan}
          options={[
            { value: "all", label: "All" },
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
          ]}
        />
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputCls} w-auto`}>
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="active">Recently active</option>
          <option value="graded">Most grades</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="users" title="No users match" body="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Rubrics</th>
                <th className="px-4 py-3 text-right">Students</th>
                <th className="px-4 py-3 text-right">Graded</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const use = usageOf(db, u);
                return (
                  <tr key={u.id} className="cursor-pointer border-t border-line transition-colors hover:bg-brand-50/50" onClick={() => setOpenId(u.id)}>
                    <td className="px-4 py-3">
                      <button type="button" className="text-left" onClick={(e) => { e.stopPropagation(); setOpenId(u.id); }}>
                        <span className="block font-semibold hover:text-brand-600">{u.name}</span>
                        <span className="block text-xs text-ink-3">{u.email}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === "active" ? "ok" : "bad"}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{use.rubrics}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{use.students}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{use.graded}</td>
                    <td className="px-4 py-3 text-ink-2">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-ink-2">{fmtDate(u.lastActiveAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserDetail user={selected} onClose={() => setOpenId(null)} />
    </div>
  );
}

function UserDetail({ user, onClose }: { user: User | null; onClose: () => void }) {
  const db = useDB();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!user) return null;

  const use = usageOf(db, user);
  const txns = db.transactions.filter((t) => t.userId === user.id);
  const events = db.activity.filter((e) => e.userId === user.id).slice(0, 6);
  const sub = user.subscription;
  const lifetime = txns.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);

  const close = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <Modal
      open
      wide
      onClose={close}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {user.name}
          <PlanBadge plan={user.plan} />
          <Badge tone={user.status === "active" ? "ok" : "bad"}>{user.status}</Badge>
        </span>
      }
      footer={
        confirmDelete ? (
          <>
            <span className="mr-auto text-sm font-medium text-bad">Delete {user.name} and all of their data?</span>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                actions.adminDeleteUser(user.id);
                toast("User deleted", "warn");
                close();
              }}
            >
              Delete user
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" icon="trash" className="mr-auto" onClick={() => setConfirmDelete(true)}>Delete</Button>
            {user.status === "active" ? (
              <Button icon="ban" onClick={() => { actions.adminSetStatus(user.id, "suspended"); toast("User suspended", "warn"); }}>Suspend</Button>
            ) : (
              <Button icon="check" onClick={() => { actions.adminSetStatus(user.id, "active"); toast("User reactivated"); }}>Reactivate</Button>
            )}
            {user.plan === "free" ? (
              <Button variant="pro" icon="star" onClick={() => { actions.adminSetPlan(user.id, "pro"); toast("Moved to Pro", "pro"); }}>Grant Pro</Button>
            ) : (
              <Button icon="minus" onClick={() => { actions.adminSetPlan(user.id, "free"); toast("Moved to Free", "warn"); }}>Move to Free</Button>
            )}
          </>
        )
      }
    >
      <p className="text-sm text-ink-2">{user.email} · {user.school || "No school"}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Mini label="Joined" value={fmtDate(user.createdAt)} />
        <Mini label="Last active" value={fmtDate(user.lastActiveAt)} />
        <Mini label="Lifetime paid" value={fmtMoney(lifetime)} />
        <Mini label="Billing" value={sub ? `${sub.interval === "annual" ? "Yearly" : "Monthly"} · ${sub.cancelAtPeriodEnd ? "ends" : "renews"} ${fmtDate(sub.renewsAt)}` : "No subscription"} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Mini label="Rubrics" value={String(use.rubrics)} big />
        <Mini label="Students" value={String(use.students)} big />
        <Mini label="Grades entered" value={String(use.graded)} big />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="pay">
          <h3 id="pay" className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">Payments</h3>
          {txns.length === 0 ? (
            <p className="text-sm text-ink-3">No payments.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {txns.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span>
                    <span className="block font-semibold">{fmtMoney(t.amount)}</span>
                    <span className="block text-xs text-ink-3">{fmtDate(t.createdAt)}</span>
                  </span>
                  <Badge tone={t.status === "paid" ? "ok" : t.status === "refunded" ? "warn" : "bad"}>{t.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="act">
          <h3 id="act" className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">Recent activity</h3>
          {events.length === 0 ? (
            <p className="text-sm text-ink-3">No activity recorded.</p>
          ) : (
            <ul className="space-y-2.5">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  {e.text}
                  <span className="block text-xs text-ink-3">{fmtDateTime(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

function Mini({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{label}</p>
      <p className={cx("mt-1 font-semibold", big && "font-display text-2xl font-extrabold")}>{value}</p>
    </div>
  );
}
