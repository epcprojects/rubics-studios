import type { Metadata } from "next";
import { GradeWorkspace } from "@/components/grade/grade-workspace";

export const metadata: Metadata = { title: "Grade" };

export default function GradePage() {
  return <GradeWorkspace />;
}
