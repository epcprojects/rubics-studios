import type { Metadata } from "next";
import { BillingAdmin } from "@/components/admin/billing-admin";

export const metadata: Metadata = { title: "Subscriptions" };

export default function AdminBillingPage() {
  return <BillingAdmin />;
}
