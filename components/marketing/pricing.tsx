"use client";

import { useState } from "react";
import { Badge, Icon, LinkButton, Segmented, cx } from "@/components/ui";
import { PLANS, annualSavings, monthlyEquivalent } from "@/lib/plans";
import { useSession } from "@/lib/store";
import type { BillingInterval } from "@/lib/types";

export function PricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const { user, plan } = useSession();

  // Visitors always start at the login page. After signing in they continue to checkout.
  const checkout = `/app/billing?upgrade=1&interval=${interval}`;
  const proHref = user ? checkout : `/login?next=${encodeURIComponent(checkout)}`;
  const freeHref = user ? "/app" : "/login";
  const price = monthlyEquivalent(interval);

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-2">
        <Segmented
          value={interval}
          onChange={setInterval}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "annual", label: "Yearly" },
          ]}
        />
        <p className="text-xs font-semibold text-ok">Yearly saves ${annualSavings()} a year</p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-line bg-surface p-7 shadow-card">
          <h3 className="font-display text-2xl font-bold">Free</h3>
          <p className="mt-1 min-h-10 text-sm text-ink-2">{PLANS.free.tagline}</p>
          <p className="mt-5 flex items-baseline gap-1">
            <span className="font-display text-5xl font-extrabold tracking-tight">$0</span>
            <span className="text-sm text-ink-3">forever</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">No card needed to start.</p>
          <LinkButton href={freeHref} variant="secondary" size="lg" className="mt-6 w-full">
            {plan === "free" && user ? "Open the app" : "Start grading free"}
          </LinkButton>
          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-3">Includes</p>
          <ul className="mt-3 space-y-2.5">
            {PLANS.free.features.map((f) => (
              <Feature key={f}>{f}</Feature>
            ))}
          </ul>
        </article>

        <article className="relative flex flex-col rounded-2xl border-2 border-brand-600 bg-surface p-7 shadow-pop">
          <Badge tone="pro" className="absolute -top-3 left-7">
            <Icon name="star" className="size-3" />
            MOST POPULAR
          </Badge>
          <h3 className="font-display text-2xl font-bold">Pro</h3>
          <p className="mt-1 min-h-10 text-sm text-ink-2">{PLANS.pro.tagline}</p>
          <p className="mt-5 flex items-baseline gap-1">
            <span className="font-display text-5xl font-extrabold tracking-tight">${price}</span>
            <span className="text-sm text-ink-3">/ month</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {interval === "annual" ? `Billed $${PLANS.pro.price.annual} once a year` : "Billed monthly, cancel any time"}
          </p>
          <LinkButton href={proHref} variant="pro" size="lg" className="mt-6 w-full">
            {plan === "pro" ? "Manage your plan" : user ? "Upgrade to Pro" : "Start with Pro"}
            <Icon name="arrowRight" />
          </LinkButton>
          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-3">Everything in Free, plus</p>
          <ul className="mt-3 space-y-2.5">
            {PLANS.pro.features.map((f) => (
              <Feature key={f} pro>
                {f}
              </Feature>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

function Feature({ children, pro }: { children: React.ReactNode; pro?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={cx(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
          pro ? "bg-brand-50 text-brand-600" : "bg-ok-bg text-ok",
        )}
      >
        <Icon name="check" className="size-3" />
      </span>
      {children}
    </li>
  );
}
