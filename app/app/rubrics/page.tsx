import type { Metadata } from "next";
import { RubricLibrary } from "@/components/rubrics/rubric-library";

export const metadata: Metadata = { title: "Rubrics" };

export default function RubricsPage() {
  return <RubricLibrary />;
}
