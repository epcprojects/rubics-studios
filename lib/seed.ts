import { PLANS } from "./plans";
import { rescale } from "./scoring";
import type {
  ActivityEvent,
  BillingInterval,
  DB,
  GradeEntry,
  Rubric,
  Transaction,
  User,
  Workspace,
} from "./types";

/** Fixed "today" for the demo data so the server and browser render identical seeds. */
export const SEED_NOW = "2026-11-26T12:00:00.000Z";
export const DB_VERSION = 1;

/** Demo logins shown as quick-fill buttons on the login page. */
export const DEMO_ACCOUNTS = [
  { label: "Teacher (Pro)", email: "demo.pro@flexgrades.test", password: "demo1234", hint: "Ms. Johnson, all Pro features" },
  { label: "Teacher (Free)", email: "demo.free@flexgrades.test", password: "demo1234", hint: "Mr. Alvarez, see the limits" },
  { label: "Admin", email: "admin@flexgrades.test", password: "admin1234", hint: "Users, revenue, subscriptions" },
] as const;

// ───────────────────────── rubric builders ─────────────────────────

function build(
  id: string,
  name: string,
  category: string,
  floor: number,
  ceiling: number,
  levels: string[],
  rows: Array<{ id: string; criteria: string; descs: string[] }>,
): Rubric {
  return rescale({
    id,
    name,
    category,
    type: "points",
    floor,
    ceiling,
    halfPoints: false,
    createdAt: SEED_NOW,
    updatedAt: SEED_NOW,
    rows: rows.map((r) => ({
      id: r.id,
      criteria: r.criteria,
      max: 0,
      ratings: levels.map((label, i) => ({ label, pts: 0, desc: r.descs[i] ?? "" })),
    })),
  });
}

export function sampleRubrics(): Rubric[] {
  const blind = build(
    "r_blind",
    "Blind Contour Portrait",
    "Summative Assessment",
    0,
    10,
    ["Exceeds", "Meets", "Not Yet"],
    [
      { id: "concept", criteria: "Concept & Clarity", descs: ["Student clearly translated the Blind Contour concept.", "Shows some understanding with minor inconsistencies.", "Concept is not evident."] },
      { id: "composition", criteria: "Composition", descs: ["Utilized the frame in a balanced composition.", "Some use of frame but could be more balanced.", "No awareness of frame composition."] },
      { id: "medium", criteria: "Medium & Viewability", descs: ["Medium worked well; portrait viewable from a distance.", "Adequate medium but hard to see from a distance.", "Medium does not support the portrait."] },
      { id: "steps", criteria: "Process & Steps", descs: ["Followed all steps for a Blind Contour Portrait.", "Followed most required steps.", "Did not follow the required process."] },
      { id: "effort", criteria: "Effort", descs: ["Gave 100% effort on the Blind Contour Portrait.", "Showed some effort but could push further.", "Little to no effort is evident."] },
    ],
  );
  const essay = build(
    "r_essay",
    "Persuasive Essay",
    "Summative Assessment",
    0,
    100,
    ["Expert", "Proficient", "Developing", "Beginning"],
    [
      { id: "thesis", criteria: "Claim & Thesis", descs: ["A precise, arguable claim frames the whole essay.", "A clear claim, though it could be sharper.", "A claim is present but vague or broad.", "No identifiable claim."] },
      { id: "evidence", criteria: "Evidence & Reasoning", descs: ["Strong, varied evidence with insightful reasoning.", "Relevant evidence with mostly sound reasoning.", "Some evidence; reasoning is thin or uneven.", "Little or no supporting evidence."] },
      { id: "organization", criteria: "Organization", descs: ["Ideas build logically with smooth transitions.", "Clear structure with occasional rough transitions.", "Structure is present but hard to follow.", "No clear organization."] },
      { id: "conventions", criteria: "Voice & Conventions", descs: ["Confident voice; virtually error-free.", "Appropriate voice; few errors.", "Inconsistent voice; errors distract.", "Errors make the writing hard to read."] },
    ],
  );
  const history = build(
    "r_history",
    "American History Timeline",
    "Formative Assessment",
    0,
    50,
    ["Expert", "Proficient", "Developing", "Still Approaching"],
    [
      { id: "accuracy", criteria: "Accuracy of Events", descs: ["All events and dates are accurate and complete.", "Most events and dates are accurate.", "Several errors or omissions.", "Many events are missing or wrong."] },
      { id: "cause", criteria: "Cause & Effect", descs: ["Connections between events are explained insightfully.", "Connections are explained clearly.", "Connections are stated but not explained.", "No connections between events."] },
      { id: "design", criteria: "Visual Design", descs: ["Neat, balanced and easy to read at a glance.", "Mostly neat and readable.", "Readable but cluttered.", "Hard to read."] },
      { id: "sources", criteria: "Sources", descs: ["Three or more credible sources, cited correctly.", "Two credible sources, cited.", "One source, or citations incomplete.", "No sources cited."] },
    ],
  );
  return [blind, essay, history];
}

const SAMPLE_STUDENTS = [
  { id: "s1", num: 1, initials: "a.r" },
  { id: "s2", num: 2, initials: "m.c" },
  { id: "s3", num: 3, initials: "j.k" },
  { id: "s4", num: 4, initials: "s.p" },
  { id: "s5", num: 5, initials: "t.b" },
  { id: "s6", num: 6, initials: "c.m" },
];

export const DEFAULT_COMMENT_BANKS = {
  en: [
    "Great job! Keep up the excellent work.",
    "Needs more effort on this assignment.",
    "The student is showing progress.",
    "Please review the rubric and resubmit.",
    "Excellent technique!",
    "Missing key components. See rubric.",
  ],
  es: [
    "¡Muy bien! Sigue con el excelente trabajo.",
    "Necesita más esfuerzo en esta tarea.",
    "El estudiante está mostrando progreso.",
    "Por favor revisa la rúbrica y vuelve a entregar.",
    "¡Excelente técnica!",
    "Faltan componentes clave.",
  ],
};

export function defaultWorkspace(teacherName = "Teacher", withSampleGrades = false): Workspace {
  const rubrics = sampleRubrics();
  const grades: Record<string, GradeEntry> = {};
  if (withSampleGrades) {
    const picks: number[][] = [
      [0, 0, 1, 0, 0],
      [1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0],
      [2, 1, 2, 1, 1],
    ];
    const comments = ["Great job! Keep up the excellent work.", "The student is showing progress.", "Excellent technique!", "Please review the rubric and resubmit."];
    picks.forEach((p, i) => {
      const ratings: Record<string, number> = {};
      rubrics[0]!.rows.forEach((row, ri) => (ratings[row.id] = p[ri]!));
      grades[`r_blind:s${i + 1}`] = {
        ratings,
        sliders: {},
        bonus: 0,
        comment: comments[i]!,
        clips: [],
        syncedTo: null,
        updatedAt: SEED_NOW,
      };
    });
  }
  return {
    teacherName,
    rubrics,
    activeRubricId: rubrics[0]!.id,
    students: SAMPLE_STUDENTS.map((s) => ({ ...s })),
    activeStudentId: "s1",
    grades,
    commentBanks: { en: [...DEFAULT_COMMENT_BANKS.en], es: [...DEFAULT_COMMENT_BANKS.es] },
  };
}

// ───────────────────────── demo users ─────────────────────────

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const DAY = 86400000;
const nowMs = new Date(SEED_NOW).getTime();
const daysAgo = (d: number) => new Date(nowMs - d * DAY).toISOString();

function addMonths(iso: string, n: number) {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString();
}

const FIRST = ["Ava", "Noah", "Priya", "Liam", "Sofia", "Mateo", "Hannah", "Omar", "Grace", "Diego", "Mei", "Ethan", "Zara", "Lucas", "Amara", "Caleb", "Nina", "Felix", "Isla", "Tariq", "Ruth", "Jonas", "Leila", "Owen"];
const LAST = ["Patel", "Nguyen", "Brooks", "Okafor", "Rossi", "Kim", "Hughes", "Santos", "Ivanov", "Clark", "Reyes", "Walker", "Ahmed", "Murphy", "Lopez", "Foster", "Chen", "Dubois", "Singh", "Baker", "Cohen", "Moreau", "Haddad", "Price"];
const SCHOOLS = ["Lincoln Middle School", "Riverside High", "Oakwood Elementary", "Summit Academy", "Maple Grove High", "Westbrook Middle", "Harbor View School", "Cedar Ridge Academy"];

function makeUsers(): { users: User[]; transactions: Transaction[] } {
  const r = rng(20261126);
  const users: User[] = [];
  const txns: Transaction[] = [];
  let txnN = 1;

  const pushTxns = (u: User, forceClean = false) => {
    if (!u.subscription) return;
    const price = PLANS.pro.price[u.subscription.interval];
    const months = u.subscription.interval === "annual" ? 1 : 12;
    for (let m = 0; m < months; m++) {
      const at = addMonths(u.subscription.startedAt, m);
      if (new Date(at).getTime() > nowMs) break;
      const roll = r();
      const status: Transaction["status"] = !forceClean && roll < 0.05 ? "failed" : !forceClean && roll < 0.09 ? "refunded" : "paid";
      txns.push({
        id: `txn_${String(txnN++).padStart(4, "0")}`,
        userId: u.id,
        amount: price,
        interval: u.subscription.interval,
        status,
        createdAt: at,
        description: `FlexGrades Pro (${u.subscription.interval})`,
      });
    }
  };

  const subscribe = (createdAt: string, interval: BillingInterval, cancel: boolean): User["subscription"] => {
    const startedAt = createdAt;
    let renewsAt = interval === "annual" ? addMonths(startedAt, 12) : addMonths(startedAt, 1);
    while (new Date(renewsAt).getTime() < nowMs) renewsAt = addMonths(renewsAt, interval === "annual" ? 12 : 1);
    return { interval, startedAt, renewsAt, cancelAtPeriodEnd: cancel, cardLast4: "4242" };
  };

  users.push({
    id: "u_admin",
    name: "Flex Admin",
    email: "admin@flexgrades.test",
    password: "admin1234",
    role: "admin",
    plan: "pro",
    status: "active",
    school: "FlexGrades HQ",
    createdAt: "2026-01-02T09:00:00.000Z",
    lastActiveAt: SEED_NOW,
    subscription: null,
  });

  const pro: User = {
    id: "u_demo_pro",
    name: "Ms. Johnson",
    email: "demo.pro@flexgrades.test",
    password: "demo1234",
    role: "teacher",
    plan: "pro",
    status: "active",
    school: "Lincoln Middle School",
    createdAt: "2026-09-04T15:20:00.000Z",
    lastActiveAt: daysAgo(0),
    subscription: subscribe("2026-09-04T15:30:00.000Z", "monthly", false),
  };
  users.push(pro);
  pushTxns(pro, true);

  users.push({
    id: "u_demo_free",
    name: "Mr. Alvarez",
    email: "demo.free@flexgrades.test",
    password: "demo1234",
    role: "teacher",
    plan: "free",
    status: "active",
    school: "Riverside High",
    createdAt: "2026-10-18T11:05:00.000Z",
    lastActiveAt: daysAgo(1),
    subscription: null,
  });

  for (let i = 0; i < 24; i++) {
    const first = FIRST[i]!;
    const last = LAST[(i * 7 + 3) % LAST.length]!;
    const age = Math.floor(r() * 265) + 4;
    const createdAt = daysAgo(age);
    const isPro = r() < 0.4;
    const interval: BillingInterval = r() < 0.4 ? "annual" : "monthly";
    const cancel = isPro && r() < 0.12;
    const suspended = i === 17;
    const idle = Math.floor(r() * Math.min(age, isPro ? 12 : 60));
    const u: User = {
      id: `u_${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@${["lincoln", "riverside", "oakwood", "summit", "maplegrove", "westbrook", "harborview", "cedarridge"][i % 8]}.edu`.toLowerCase(),
      password: "demo1234",
      role: "teacher",
      plan: isPro ? "pro" : "free",
      status: suspended ? "suspended" : "active",
      school: SCHOOLS[i % SCHOOLS.length]!,
      createdAt,
      lastActiveAt: daysAgo(idle),
      subscription: isPro ? subscribe(new Date(new Date(createdAt).getTime() + Math.floor(r() * 14) * DAY).toISOString(), interval, cancel) : null,
      seedUsage: isPro
        ? { rubrics: 4 + Math.floor(r() * 14), students: 30 + Math.floor(r() * 130), graded: 120 + Math.floor(r() * 900) }
        : { rubrics: 1 + Math.floor(r() * 3), students: 6 + Math.floor(r() * 29), graded: 4 + Math.floor(r() * 90) },
    };
    users.push(u);
    pushTxns(u);
  }

  txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { users, transactions: txns };
}

function makeActivity(users: User[]): ActivityEvent[] {
  const ev: ActivityEvent[] = [];
  let n = 1;
  for (const u of users) {
    if (u.role === "admin") continue;
    ev.push({ id: `ev_${n++}`, userId: u.id, type: "signup", text: `${u.name} created an account`, at: u.createdAt });
    if (u.subscription) ev.push({ id: `ev_${n++}`, userId: u.id, type: "upgrade", text: `${u.name} upgraded to Pro (${u.subscription.interval})`, at: u.subscription.startedAt });
    if (u.subscription?.cancelAtPeriodEnd) ev.push({ id: `ev_${n++}`, userId: u.id, type: "cancel", text: `${u.name} cancelled Pro (ends at period end)`, at: daysAgo(3) });
  }
  return ev.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
}

export function createSeedDB(): DB {
  const { users, transactions } = makeUsers();
  return {
    version: DB_VERSION,
    users,
    transactions,
    activity: makeActivity(users),
    session: { userId: null },
    workspaces: {
      guest: defaultWorkspace("Teacher", false),
      u_demo_pro: defaultWorkspace("Ms. Johnson", true),
      u_demo_free: defaultWorkspace("Mr. Alvarez", false),
    },
  };
}
