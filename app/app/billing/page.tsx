import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingView } from "@/components/billing/billing-view";

export const metadata: Metadata = { title: "Plan & billing" };

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingView />
    </Suspense>
  );
}
