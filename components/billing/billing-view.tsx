"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardTitle, Field, Icon, LinkButton, Modal, PageHeader, PlanBadge, ProgressBar, Segmented, inputCls } from "@/components/ui";
import { fmtDate, fmtMoney } from "@/lib/format";
import { PLANS, annualSavings, monthlyEquivalent } from "@/lib/plans";
import { actions, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { BillingInterval } from "@/lib/types";

export function BillingView() {
  const params = useSearchParams();
  const router = useRouter();
  const { db, user, plan, hydrated } = useSession();
  const ws = useWorkspace();
  const [checkout, setCheckout] = useState(params.get("upgrade") === "1");
  const [interval, setInterval] = useState<BillingInterval>(params.get("interval") === "monthly" ? "monthly" : "annual");
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!hydrated) return null;

  if (!user) {
    return (
      <div>
        <PageHeader title="Plan & billing" />
        <Card className="mx-auto max-w-xl py-10 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="user" className="size-6" />
          </span>
          <h2 className="font-display text-2xl font-bold">Create an account to upgrade</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">Pro is tied to your account so your rubrics, grades and subscription follow you to any device. Whatever you built as a guest comes with you.</p>
          <div className="mt-6 flex justify-center gap-2">
            <LinkButton href="/signup?plan=pro" variant="pro">Create account<Icon name="arrowRight" /></LinkButton>
            <LinkButton href="/login" variant="secondary">Sign in</LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const sub = user.subscription;
  const invoices = db.transactions.filter((t) => t.userId === user.id);
  const limits = PLANS[plan].limits;

  return (
    <div>
      <PageHeader title="Plan & billing" subtitle="Your subscription, usage and receipts." />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Current plan</p>
              <p className="mt-1 flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight">
                {PLANS[plan].name} <PlanBadge plan={plan} />
              </p>
            </div>
            {plan === "pro" && sub ? (
              <p className="text-right">
                <span className="font-display text-2xl font-extrabold">{fmtMoney(PLANS.pro.price[sub.interval])}</span>
                <span className="text-sm text-ink-3"> / {sub.interval === "annual" ? "year" : "month"}</span>
              </p>
            ) : (
              <p className="text-right font-display text-2xl font-extrabold">$0</p>
            )}
          </div>

          {plan === "pro" && sub ? (
            <>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <Info label="Started" value={fmtDate(sub.startedAt)} />
                <Info label={sub.cancelAtPeriodEnd ? "Ends on" : "Renews on"} value={fmtDate(sub.renewsAt)} />
                <Info label="Payment method" value={`Card ending ${sub.cardLast4}`} />
              </dl>
              {sub.cancelAtPeriodEnd && (
                <p className="mt-4 rounded-lg bg-warn-bg px-4 py-3 text-sm font-medium text-warn">
                  Your Pro plan is cancelled. You keep every Pro feature until {fmtDate(sub.renewsAt)}, then move to Free.
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {sub.cancelAtPeriodEnd ? (
                  <>
                    <Button variant="primary" onClick={() => { actions.resumeSubscription(); toast("Pro will keep renewing", "pro"); }}>Keep Pro</Button>
                    <Button variant="ghost" onClick={() => { actions.endBillingPeriod(); toast("Moved to Free (demo: period ended)", "warn"); }}>Simulate end of period</Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setCancelOpen(true)}>Cancel subscription</Button>
                )}
              </div>
            </>
          ) : plan === "pro" ? (
            <p className="mt-4 text-sm text-ink-2">Pro access was granted to this account by an administrator. There is no subscription to manage.</p>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink-2">{PLANS.free.tagline} Upgrade to remove the limits and add AI rubrics, voice feedback and gradebook sync.</p>
              <Button variant="pro" size="lg" className="mt-5" onClick={() => setCheckout(true)}>
                <Icon name="star" />
                Upgrade to Pro
              </Button>
            </>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle>Usage</CardTitle>
          <Usage label="Saved rubrics" value={ws.rubrics.length} max={limits.rubrics} />
          <Usage label="Students" value={ws.students.length} max={limits.students} />
          {plan === "free" && (
            <p className="mt-5 text-xs text-ink-3">Free includes {PLANS.free.limits.rubrics} rubrics and {PLANS.free.limits.students} students. Pro has no limits.</p>
          )}
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="invoices">
        <h2 id="invoices" className="mb-3 font-display text-xl font-bold">Receipts</h2>
        {invoices.length === 0 ? (
          <Card className="py-8 text-center text-sm text-ink-3">No payments yet.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-4 py-3">{fmtDate(t.createdAt)}</td>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3 font-semibold">{fmtMoney(t.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={t.status === "paid" ? "ok" : t.status === "refunded" ? "warn" : "bad"}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CheckoutModal
        open={checkout && plan === "free"}
        onClose={() => {
          setCheckout(false);
          if (params.get("upgrade")) router.replace("/app/billing");
        }}
        interval={interval}
        setInterval={setInterval}
      />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Pro?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep Pro</Button>
            <Button
              variant="danger"
              onClick={() => {
                actions.cancelSubscription();
                setCancelOpen(false);
                toast("Subscription cancelled", "warn");
              }}
            >
              Cancel subscription
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          You keep Pro until {sub ? fmtDate(sub.renewsAt) : "the end of the period"}. After that you move to the Free plan: your rubrics stay, but AI, voice feedback and gradebook sync turn off.
        </p>
      </Modal>

      <p className="mt-8 text-center text-xs text-ink-3">
        Prototype: payments are simulated. <Link href="/pricing" className="font-semibold text-brand-600 hover:underline">View public pricing</Link>
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function Usage({ label, value, max }: { label: string; value: number; max: number }) {
  const unlimited = !Number.isFinite(max);
  return (
    <div className="mb-4">
      <p className="mb-1.5 flex justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="font-semibold">{unlimited ? `${value} (unlimited)` : `${value} / ${max}`}</span>
      </p>
      <ProgressBar value={unlimited ? 12 : value} max={unlimited ? 100 : max} tone={!unlimited && value >= max ? "bad" : !unlimited && value >= max * 0.8 ? "warn" : "brand"} />
    </div>
  );
}

function CheckoutModal({
  open,
  onClose,
  interval,
  setInterval,
}: {
  open: boolean;
  onClose: () => void;
  interval: BillingInterval;
  setInterval: (i: BillingInterval) => void;
}) {
  const [busy, setBusy] = useState(false);
  const total = PLANS.pro.price[interval];

  function pay() {
    setBusy(true);
    setTimeout(() => {
      const res = actions.upgrade(interval, "4242");
      setBusy(false);
      if (!res.ok) return toast(res.error, "bad");
      toast("You're on Pro. Thank you!", "pro");
      onClose();
    }, 1200);
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Upgrade to Pro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="pro" onClick={pay} disabled={busy}>
            {busy ? "Processing…" : `Pay ${fmtMoney(total)}`}
          </Button>
        </>
      }
    >
      <Segmented
        className="mb-1 w-full"
        value={interval}
        onChange={setInterval}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "annual", label: "Yearly" },
        ]}
      />
      {interval === "annual" && <p className="mb-3 text-center text-xs font-semibold text-ok">Saves ${annualSavings()} a year</p>}

      <div className="my-4 flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">FlexGrades Pro</p>
          <p className="text-xs text-ink-3">{interval === "annual" ? `${fmtMoney(monthlyEquivalent("annual"))}/month, billed yearly` : "Billed monthly"}</p>
        </div>
        <p className="font-display text-2xl font-extrabold">{fmtMoney(total)}</p>
      </div>

      <p className="mb-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
        <Icon name="info" className="mt-0.5 size-3.5" />
        Test mode. This uses a sample card and no real payment is taken.
      </p>
      <div className="space-y-3">
        <Field label="Card number" htmlFor="card">
          <input id="card" className={inputCls} defaultValue="4242 4242 4242 4242" inputMode="numeric" autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" htmlFor="exp">
            <input id="exp" className={inputCls} defaultValue="12 / 34" autoComplete="off" />
          </Field>
          <Field label="CVC" htmlFor="cvc">
            <input id="cvc" className={inputCls} defaultValue="123" autoComplete="off" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
