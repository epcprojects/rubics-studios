import { PLANS } from "./plans";
import { SEED_NOW } from "./seed";
import type { DB, Usage, User } from "./types";

export function usageOf(db: DB, user: User): Usage {
  const w = db.workspaces[user.id];
  if (!w) return user.seedUsage ?? { rubrics: 0, students: 0, graded: 0 };
  return {
    rubrics: w.rubrics.length,
    students: w.students.length,
    graded: Object.values(w.grades).filter((g) => Object.keys(g.ratings).length > 0).length,
  };
}

/** Monthly recurring revenue: annual plans count as price / 12. Cancelled-at-period-end plans still count until they end. */
export function mrrOf(users: User[]): number {
  let total = 0;
  for (const u of users) {
    if (u.plan !== "pro" || !u.subscription || u.status === "suspended") continue;
    total += u.subscription.interval === "annual" ? PLANS.pro.price.annual / 12 : PLANS.pro.price.monthly;
  }
  return total;
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

/** Last `n` calendar months ending at the seed "today", oldest first. */
export function lastMonths(n: number): Array<{ key: string; label: string }> {
  const end = new Date(SEED_NOW);
  const out: Array<{ key: string; label: string }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    out.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    });
  }
  return out;
}

export function signupsByMonth(users: User[], months: Array<{ key: string }>) {
  const teachers = users.filter((u) => u.role === "teacher");
  return months.map((m) => ({
    total: teachers.filter((u) => monthKey(u.createdAt) === m.key).length,
    pro: teachers.filter((u) => monthKey(u.createdAt) === m.key && u.plan === "pro").length,
  }));
}

export function revenueByMonth(db: DB, months: Array<{ key: string }>) {
  return months.map((m) =>
    db.transactions.filter((t) => t.status === "paid" && monthKey(t.createdAt) === m.key).reduce((s, t) => s + t.amount, 0),
  );
}
