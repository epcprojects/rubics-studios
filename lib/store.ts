/**
 * Prototype "backend".
 *
 * Everything the app knows (accounts, subscriptions, rubrics, grades) lives in one object that is
 * persisted to localStorage. Components subscribe through `useSyncExternalStore`, and every change
 * goes through `commit`. Swapping this file for real API calls (database + auth + Stripe) is the
 * production step; the screens only ever talk to the hooks and `actions` exported here.
 */
import { useSyncExternalStore } from "react";
import { PLANS } from "./plans";
import { createSeedDB, DB_VERSION, defaultWorkspace } from "./seed";
import { maxEarnable, rescale } from "./scoring";
import type {
  ActivityEvent,
  BillingInterval,
  DB,
  GradeEntry,
  PlanId,
  Result,
  Rubric,
  Student,
  User,
  UserStatus,
  Workspace,
} from "./types";

const STORAGE_KEY = "flexgrades.db.v1";
const SERVER_DB = createSeedDB();

let state: DB = SERVER_DB;
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as DB;
    if (parsed && parsed.version === DB_VERSION && Array.isArray(parsed.users)) state = parsed;
  } catch {
    /* corrupt or blocked storage: fall back to the seed */
  }
}

if (typeof window !== "undefined") {
  load();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      load();
      emit();
    }
  });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(mutator: (draft: DB) => void) {
  const draft = structuredClone(state);
  mutator(draft);
  state = draft;
  persist();
  emit();
}

// ───────────────────────── hooks ─────────────────────────

export function useDB(): DB {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_DB,
  );
}

const noopSubscribe = () => () => {};
/** False during server render and hydration, true afterwards. Gate anything that depends on localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function currentUser(db: DB): User | null {
  const id = db.session.userId;
  return id ? (db.users.find((u) => u.id === id) ?? null) : null;
}

export function planOf(db: DB): PlanId {
  return currentUser(db)?.plan ?? "free";
}

export function ownerOf(db: DB): string {
  return db.session.userId ?? "guest";
}

export function useSession() {
  const db = useDB();
  const hydrated = useHydrated();
  const user = currentUser(db);
  return {
    db,
    hydrated,
    user,
    plan: (user?.plan ?? "free") as PlanId,
    isPro: user?.plan === "pro",
    isAdmin: user?.role === "admin",
    isGuest: !user,
    ownerId: ownerOf(db),
  };
}

export function useWorkspace(): Workspace {
  const db = useDB();
  return db.workspaces[ownerOf(db)] ?? db.workspaces.guest!;
}

// ───────────────────────── internals ─────────────────────────

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();

function log(d: DB, type: ActivityEvent["type"], text: string, userId?: string) {
  d.activity.unshift({ id: uid("ev"), userId: userId ?? ownerOf(d), type, text, at: nowIso() });
  if (d.activity.length > 200) d.activity.length = 200;
}

function ws(d: DB): Workspace {
  const key = ownerOf(d);
  if (!d.workspaces[key]) {
    const u = d.users.find((x) => x.id === key);
    d.workspaces[key] = defaultWorkspace(u?.name ?? "Teacher", false);
  }
  return d.workspaces[key]!;
}

const gradeKey = (rubricId: string, studentId: string) => `${rubricId}:${studentId}`;

export function emptyEntry(): GradeEntry {
  return { ratings: {}, sliders: {}, bonus: 0, comment: "", clips: [], syncedTo: null, updatedAt: "" };
}

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

// ───────────────────────── actions ─────────────────────────

export const actions = {
  // ── auth ──
  login(email: string, password: string): Result<User> {
    const found = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || found.password !== password) return fail("That email and password don't match.");
    if (found.status === "suspended") return fail("This account is suspended. Please contact support.");
    commit((d) => {
      d.session.userId = found.id;
      const u = d.users.find((x) => x.id === found.id)!;
      u.lastActiveAt = nowIso();
      ws(d);
      if (u.role === "teacher") log(d, "login", `${u.name} signed in`, u.id);
    });
    return { ok: true, data: found };
  },

  signup(input: { name: string; email: string; password: string; school: string }): Result<User> {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim()) return fail("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email address.");
    if (input.password.length < 6) return fail("Password must be at least 6 characters.");
    if (state.users.some((u) => u.email.toLowerCase() === email)) return fail("An account with that email already exists.");
    const user: User = {
      id: uid("u"),
      name: input.name.trim(),
      email,
      password: input.password,
      role: "teacher",
      plan: "free",
      status: "active",
      school: input.school.trim(),
      createdAt: nowIso(),
      lastActiveAt: nowIso(),
      subscription: null,
    };
    commit((d) => {
      d.users.push(user);
      // Carry over whatever the visitor already built as a guest.
      d.workspaces[user.id] = { ...structuredClone(d.workspaces.guest ?? defaultWorkspace()), teacherName: user.name };
      d.workspaces.guest = defaultWorkspace("Teacher", false);
      d.session.userId = user.id;
      log(d, "signup", `${user.name} created an account`, user.id);
    });
    return { ok: true, data: user };
  },

  logout() {
    commit((d) => {
      d.session.userId = null;
    });
  },

  resetDemo() {
    state = createSeedDB();
    persist();
    emit();
  },

  // ── workspace: teacher name, rubrics ──
  setTeacherName(name: string) {
    commit((d) => {
      ws(d).teacherName = name.trim() || ws(d).teacherName;
      const u = currentUser(d);
      if (u && name.trim()) u.name = name.trim();
    });
  },

  setActiveRubric(id: string) {
    commit((d) => {
      ws(d).activeRubricId = id;
    });
  },

  setActiveStudent(id: string) {
    commit((d) => {
      ws(d).activeStudentId = id;
    });
  },

  createRubric(rubric: Rubric): Result<Rubric> {
    const limit = PLANS[planOf(state)].limits.rubrics;
    const current = state.workspaces[ownerOf(state)] ?? state.workspaces.guest!;
    if (current.rubrics.length >= limit) {
      return fail(`The Free plan includes ${limit} saved rubrics. Upgrade to Pro for unlimited rubrics.`);
    }
    const r: Rubric = { ...rubric, id: uid("r"), createdAt: nowIso(), updatedAt: nowIso() };
    commit((d) => {
      const w = ws(d);
      w.rubrics.unshift(r);
      w.activeRubricId = r.id;
      log(d, "rubric", `Created rubric "${r.name}"`);
    });
    return { ok: true, data: r };
  },

  duplicateRubric(id: string): Result<Rubric> {
    const src = (state.workspaces[ownerOf(state)] ?? state.workspaces.guest!).rubrics.find((r) => r.id === id);
    if (!src) return fail("Rubric not found.");
    return actions.createRubric({ ...structuredClone(src), name: `${src.name} (copy)` });
  },

  updateRubric(id: string, fn: (r: Rubric) => Rubric) {
    commit((d) => {
      const w = ws(d);
      const i = w.rubrics.findIndex((r) => r.id === id);
      if (i < 0) return;
      w.rubrics[i] = { ...fn(w.rubrics[i]!), updatedAt: nowIso() };
    });
  },

  setRubricScale(id: string, floor: number, ceiling: number) {
    actions.updateRubric(id, (r) => rescale({ ...r, floor, ceiling }));
    // Manual point overrides no longer match the new scale.
    commit((d) => {
      const w = ws(d);
      for (const k of Object.keys(w.grades)) {
        if (k.startsWith(`${id}:`)) w.grades[k]!.sliders = {};
      }
    });
  },

  /** Replace a rubric's rows (AI generation, upload, builder) and clear grades that no longer apply. */
  replaceRubricRows(id: string, name: string, rows: Rubric["rows"], keepPoints: boolean) {
    commit((d) => {
      const w = ws(d);
      const i = w.rubrics.findIndex((r) => r.id === id);
      if (i < 0) return;
      let next: Rubric = { ...w.rubrics[i]!, name, rows, updatedAt: nowIso() };
      if (keepPoints) next = { ...next, floor: 0, ceiling: maxEarnable(next) };
      else next = rescale(next);
      w.rubrics[i] = next;
      for (const k of Object.keys(w.grades)) if (k.startsWith(`${id}:`)) delete w.grades[k];
    });
  },

  deleteRubric(id: string) {
    commit((d) => {
      const w = ws(d);
      w.rubrics = w.rubrics.filter((r) => r.id !== id);
      for (const k of Object.keys(w.grades)) if (k.startsWith(`${id}:`)) delete w.grades[k];
      if (w.activeRubricId === id) w.activeRubricId = w.rubrics[0]?.id ?? null;
    });
  },

  // ── workspace: students ──
  addStudents(list: Array<{ num: number; initials: string }>): Result<number> {
    const limit = PLANS[planOf(state)].limits.students;
    const w = state.workspaces[ownerOf(state)] ?? state.workspaces.guest!;
    if (w.students.length + list.length > limit) {
      return fail(`The Free plan includes up to ${limit} students. Upgrade to Pro for unlimited students.`);
    }
    commit((d) => {
      const wd = ws(d);
      const taken = new Set(wd.students.map((s) => s.num));
      for (const item of list) {
        let n = item.num;
        while (taken.has(n)) n++;
        taken.add(n);
        wd.students.push({ id: uid("s"), num: n, initials: item.initials });
      }
      wd.students.sort((a, b) => a.num - b.num);
      if (!wd.activeStudentId) wd.activeStudentId = wd.students[0]?.id ?? null;
    });
    return { ok: true, data: list.length };
  },

  updateStudent(id: string, patch: Partial<Pick<Student, "num" | "initials">>) {
    commit((d) => {
      const w = ws(d);
      const s = w.students.find((x) => x.id === id);
      if (!s) return;
      Object.assign(s, patch);
      w.students.sort((a, b) => a.num - b.num);
    });
  },

  deleteStudent(id: string) {
    commit((d) => {
      const w = ws(d);
      w.students = w.students.filter((s) => s.id !== id);
      for (const k of Object.keys(w.grades)) if (k.endsWith(`:${id}`)) delete w.grades[k];
      if (w.activeStudentId === id) w.activeStudentId = w.students[0]?.id ?? null;
    });
  },

  // ── workspace: grading ──
  updateGrade(rubricId: string, studentId: string, fn: (e: GradeEntry) => GradeEntry) {
    commit((d) => {
      const w = ws(d);
      const key = gradeKey(rubricId, studentId);
      w.grades[key] = { ...fn(w.grades[key] ?? emptyEntry()), updatedAt: nowIso() };
    });
  },

  clearGrade(rubricId: string, studentId: string) {
    commit((d) => {
      delete ws(d).grades[gradeKey(rubricId, studentId)];
    });
  },

  addComment(lang: "en" | "es", text: string) {
    const t = text.trim();
    if (!t) return;
    commit((d) => {
      ws(d).commentBanks[lang].push(t);
    });
  },

  removeComment(lang: "en" | "es", index: number) {
    commit((d) => {
      ws(d).commentBanks[lang].splice(index, 1);
    });
  },

  /** Simulated gradebook sync. Marks every fully graded student as sent. */
  syncGrades(rubricId: string, studentIds: string[], target: string): Result<number> {
    if (planOf(state) !== "pro") return fail("Gradebook sync is a Pro feature.");
    commit((d) => {
      const w = ws(d);
      for (const sid of studentIds) {
        const e = w.grades[gradeKey(rubricId, sid)];
        if (e) e.syncedTo = target;
      }
      log(d, "sync", `Sent ${studentIds.length} grades to ${target}`);
    });
    return { ok: true, data: studentIds.length };
  },

  logAI(text: string) {
    commit((d) => log(d, "ai", text));
  },

  // ── billing ──
  upgrade(interval: BillingInterval, cardLast4: string): Result<User> {
    const me = currentUser(state);
    if (!me) return fail("Please sign in to upgrade.");
    const price = PLANS.pro.price[interval];
    commit((d) => {
      const u = d.users.find((x) => x.id === me.id)!;
      const start = new Date();
      const renews = new Date(start);
      renews.setUTCMonth(renews.getUTCMonth() + (interval === "annual" ? 12 : 1));
      u.plan = "pro";
      u.subscription = {
        interval,
        startedAt: start.toISOString(),
        renewsAt: renews.toISOString(),
        cancelAtPeriodEnd: false,
        cardLast4,
      };
      d.transactions.unshift({
        id: uid("txn"),
        userId: u.id,
        amount: price,
        interval,
        status: "paid",
        createdAt: start.toISOString(),
        description: `FlexGrades Pro (${interval})`,
      });
      log(d, "upgrade", `${u.name} upgraded to Pro (${interval})`, u.id);
    });
    return { ok: true, data: currentUser(state)! };
  },

  cancelSubscription() {
    commit((d) => {
      const u = currentUser(d);
      if (!u?.subscription) return;
      u.subscription.cancelAtPeriodEnd = true;
      log(d, "cancel", `${u.name} cancelled Pro (ends at period end)`, u.id);
    });
  },

  resumeSubscription() {
    commit((d) => {
      const u = currentUser(d);
      if (!u?.subscription) return;
      u.subscription.cancelAtPeriodEnd = false;
      log(d, "resume", `${u.name} resumed Pro`, u.id);
    });
  },

  /** Demo helper: jump to the end of the billing period so the downgrade can be shown. */
  endBillingPeriod() {
    commit((d) => {
      const u = currentUser(d);
      if (!u?.subscription) return;
      if (u.subscription.cancelAtPeriodEnd) {
        u.plan = "free";
        u.subscription = null;
      }
    });
  },

  // ── admin ──
  adminSetPlan(userId: string, plan: PlanId, interval: BillingInterval = "monthly") {
    commit((d) => {
      const u = d.users.find((x) => x.id === userId);
      if (!u || u.plan === plan) return;
      u.plan = plan;
      if (plan === "pro") {
        const start = new Date();
        const renews = new Date(start);
        renews.setUTCMonth(renews.getUTCMonth() + (interval === "annual" ? 12 : 1));
        u.subscription = { interval, startedAt: start.toISOString(), renewsAt: renews.toISOString(), cancelAtPeriodEnd: false, cardLast4: "0000" };
      } else {
        u.subscription = null;
      }
      log(d, "admin", `Admin changed ${u.name} to ${plan === "pro" ? "Pro" : "Free"}`, u.id);
    });
  },

  adminSetStatus(userId: string, status: UserStatus) {
    commit((d) => {
      const u = d.users.find((x) => x.id === userId);
      if (!u) return;
      u.status = status;
      log(d, "admin", `Admin ${status === "suspended" ? "suspended" : "reactivated"} ${u.name}`, u.id);
    });
  },

  adminDeleteUser(userId: string) {
    commit((d) => {
      const u = d.users.find((x) => x.id === userId);
      if (!u || u.role === "admin") return;
      d.users = d.users.filter((x) => x.id !== userId);
      d.transactions = d.transactions.filter((t) => t.userId !== userId);
      delete d.workspaces[userId];
      log(d, "admin", `Admin deleted ${u.name}`, "u_admin");
    });
  },

  adminRefund(txnId: string) {
    commit((d) => {
      const t = d.transactions.find((x) => x.id === txnId);
      if (t && t.status === "paid") {
        t.status = "refunded";
        log(d, "admin", `Admin refunded ${t.id}`, t.userId);
      }
    });
  },
};
