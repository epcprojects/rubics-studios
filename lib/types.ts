export type PlanId = "free" | "pro";
export type BillingInterval = "monthly" | "annual";
export type Role = "teacher" | "admin";
export type UserStatus = "active" | "suspended";
export type RubricType = "points" | "pct" | "nopoints";

export interface Usage {
  rubrics: number;
  students: number;
  graded: number;
}

export interface Subscription {
  interval: BillingInterval;
  startedAt: string;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
  cardLast4: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Prototype only. A real build stores a salted hash, never the password. */
  password: string;
  role: Role;
  plan: PlanId;
  status: UserStatus;
  school: string;
  createdAt: string;
  lastActiveAt: string;
  subscription: Subscription | null;
  /** Static usage numbers for seeded demo accounts that have no workspace. */
  seedUsage?: Usage;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  interval: BillingInterval;
  status: "paid" | "refunded" | "failed";
  createdAt: string;
  description: string;
}

export interface Rating {
  label: string;
  pts: number;
  desc: string;
}

export interface RubricRow {
  id: string;
  criteria: string;
  ratings: Rating[];
  max: number;
}

export interface Rubric {
  id: string;
  name: string;
  category: string;
  type: RubricType;
  floor: number;
  ceiling: number;
  halfPoints: boolean;
  rows: RubricRow[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  num: number;
  initials: string;
}

export interface VoiceClip {
  id: string;
  seconds: number;
}

export interface GradeEntry {
  /** rowId -> selected rating index */
  ratings: Record<string, number>;
  /** rowId -> manual point override */
  sliders: Record<string, number>;
  bonus: number;
  comment: string;
  clips: VoiceClip[];
  syncedTo: string | null;
  updatedAt: string;
}

export interface Workspace {
  teacherName: string;
  rubrics: Rubric[];
  activeRubricId: string | null;
  students: Student[];
  activeStudentId: string | null;
  /** key: `${rubricId}:${studentId}` */
  grades: Record<string, GradeEntry>;
  commentBanks: { en: string[]; es: string[] };
}

export interface ActivityEvent {
  id: string;
  userId: string;
  type: "signup" | "login" | "upgrade" | "cancel" | "resume" | "rubric" | "ai" | "sync" | "admin";
  text: string;
  at: string;
}

export interface DB {
  version: number;
  users: User[];
  transactions: Transaction[];
  activity: ActivityEvent[];
  session: { userId: string | null };
  /** key: user id, or "guest" for visitors who are not signed in */
  workspaces: Record<string, Workspace>;
}

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };
