import type { Metadata } from "next";
import { Overview } from "@/components/app/overview";

export const metadata: Metadata = { title: "Overview" };

export default function AppIndex() {
  return <Overview />;
}
