"use client";

import Link from "next/link";
import { Icon, Modal, LinkButton, Button } from "@/components/ui";
import { PLANS, monthlyEquivalent } from "@/lib/plans";
import { useSession } from "@/lib/store";

export function UpgradeModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { user } = useSession();
  const target = user ? "/app/billing?upgrade=1" : "/signup?plan=pro";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade to Pro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <LinkButton href={target} variant="pro">
            {user ? "See Pro plans" : "Create account to upgrade"}
            <Icon name="arrowRight" />
          </LinkButton>
        </>
      }
    >
      {reason && <p className="mb-3 rounded-lg bg-warn-bg px-3 py-2 text-sm font-medium text-warn">{reason}</p>}
      <p className="text-sm text-ink-2">
        Pro is ${monthlyEquivalent("annual")}/month billed yearly, or ${PLANS.pro.price.monthly}/month. Cancel any time.
      </p>
      <ul className="mt-4 space-y-2.5">
        {PLANS.pro.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ok-bg text-ok">
              <Icon name="check" className="size-3" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      {!user && (
        <p className="mt-4 text-xs text-ink-3">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </Modal>
  );
}
