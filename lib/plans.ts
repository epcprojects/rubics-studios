import type { BillingInterval, PlanId } from "./types";

/**
 * Pricing and limits are placeholders until the client confirms them.
 * Everything in the app reads from here, so changing a number changes it everywhere.
 */
export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    tagline: string;
    price: Record<BillingInterval, number>;
    limits: { rubrics: number; students: number };
    features: string[];
  }
> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Everything a teacher needs to grade with a rubric.",
    price: { monthly: 0, annual: 0 },
    limits: { rubrics: 5, students: 35 },
    features: [
      "Up to 5 saved rubrics",
      "Up to 35 students",
      "Click-to-score rubric grading",
      "Comment bank in English and Spanish",
      "Print rubrics and grade lists",
      "Export grades to CSV",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For teachers who want grading to take minutes, not evenings.",
    price: { monthly: 7, annual: 60 },
    limits: { rubrics: Infinity, students: Infinity },
    features: [
      "Unlimited rubrics and students",
      "AI rubric generator",
      "Upload a photo or PDF, get a live rubric",
      "Voice feedback recordings",
      "Send grades to PowerSchool, Illuminate and Google Classroom",
      "Rubrics saved to your account on any device",
    ],
  },
};

export const PRO_FEATURES = {
  ai: "AI rubric generator",
  upload: "Rubric upload",
  voice: "Voice feedback",
  sync: "Gradebook sync",
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;

export function monthlyEquivalent(interval: BillingInterval) {
  const p = PLANS.pro.price;
  return interval === "annual" ? p.annual / 12 : p.monthly;
}

export function annualSavings() {
  const p = PLANS.pro.price;
  return p.monthly * 12 - p.annual;
}

export const GRADEBOOKS = ["PowerSchool", "Illuminate", "Google Classroom"] as const;
