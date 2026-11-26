"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, Icon, inputCls } from "@/components/ui";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { actions, useSession } from "@/lib/store";
import { toast } from "@/lib/toast";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, hydrated } = useSession();

  const wantsPro = params.get("plan") === "pro";
  const interval = params.get("interval") === "monthly" ? "monthly" : "annual";
  const next = params.get("next");

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const isSignup = mode === "signup";

  function go(role: string) {
    if (role === "admin") return router.push("/admin");
    if (isSignup && wantsPro) return router.push(`/app/billing?upgrade=1&interval=${interval}`);
    router.push(next && next.startsWith("/") ? next : "/app");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = isSignup ? actions.signup({ name, email, password, school }) : actions.login(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast(isSignup ? `Welcome, ${res.data.name.split(" ")[0]}!` : `Welcome back, ${res.data.name.split(" ")[0]}`);
    go(res.data.role);
  }

  if (hydrated && user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center shadow-card">
        <p className="font-semibold">You are signed in as {user.name}</p>
        <p className="mt-1 text-sm text-ink-2">{user.email}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="primary" onClick={() => go(user.role)}>
            Continue
            <Icon name="arrowRight" />
          </Button>
          <Button variant="secondary" onClick={() => actions.logout()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1.5 text-sm text-ink-2">
        {isSignup
          ? wantsPro
            ? "Create your account, then pick up Pro in the next step."
            : "Free to start. Upgrade whenever you like."
          : "Sign in to open your rubrics and gradebook."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-bad-bg px-3 py-2.5 text-sm font-medium text-bad">
            <Icon name="info" className="mt-0.5 size-4" />
            {error}
          </div>
        )}
        {isSignup && (
          <>
            <Field label="Your name" htmlFor="name">
              <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms. Johnson" autoComplete="name" required />
            </Field>
            <Field label="School (optional)" htmlFor="school">
              <input id="school" className={inputCls} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Lincoln Middle School" autoComplete="organization" />
            </Field>
          </>
        )}
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint={isSignup ? "At least 6 characters." : undefined}>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              className={`${inputCls} pr-16`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-ink-3 hover:text-ink"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full">
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-2">
        {isSignup ? "Already have an account? " : "New to FlexGrades? "}
        <Link
          href={`${isSignup ? "/login" : "/signup"}${wantsPro ? `?plan=pro&interval=${interval}` : ""}`}
          className="font-semibold text-brand-600 hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>

      {!isSignup && (
        <div className="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Prototype demo accounts</p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                  setError(null);
                }}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand-600"
              >
                <span>
                  <span className="block text-sm font-semibold">{a.label}</span>
                  <span className="block text-xs text-ink-3">{a.hint}</span>
                </span>
                <span className="text-xs font-semibold text-brand-600">Fill in</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
