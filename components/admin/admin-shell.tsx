"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, Icon, IconButton, LinkButton, Logo, cx, type IconName } from "@/components/ui";
import { actions, useSession } from "@/lib/store";
import { toast } from "@/lib/toast";

const NAV: Array<{ href: string; label: string; icon: IconName; exact?: boolean }> = [
  { href: "/admin", label: "Overview", icon: "chart", exact: true },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/billing", label: "Subscriptions", icon: "receipt" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { hydrated, user, isAdmin } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  if (!hydrated) {
    // Keep the page rendered (invisible) so Next can validate the route; show the loader on top.
    return (
      <>
        <div role="status" className="fixed inset-0 z-50 grid place-items-center bg-bg text-sm font-semibold text-ink-3">
          Loading admin console
        </div>
        <div aria-hidden className="invisible">
          {children}
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="shield" className="size-6" />
          </span>
          <h1 className="font-display text-2xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm text-ink-2">
            {user ? `You are signed in as ${user.name}, which is a teacher account.` : "Sign in with an administrator account to see users, subscriptions and revenue."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <LinkButton href="/login?next=/admin" variant="primary">{user ? "Switch account" : "Sign in"}</LinkButton>
            <LinkButton href="/">Back to site</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="flex gap-1 lg:flex-col" aria-label="Admin">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setMenu(false)}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon name={n.icon} className="size-[18px]" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="hidden h-dvh flex-col bg-brand-900 p-4 lg:sticky lg:top-0 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2 pt-1">
          <Logo href="/admin" className="[&_span]:!text-white" />
        </div>
        <Badge tone="pro" className="mb-4 w-fit"><Icon name="shield" className="size-3" />ADMIN</Badge>
        {nav}
        <div className="mt-auto space-y-1">
          <Link href="/app/grade" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white">
            <Icon name="clipboard" className="size-[18px]" />
            Open teacher app
          </Link>
          <button
            type="button"
            onClick={() => {
              actions.logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="size-[18px]" />
            Sign out
          </button>
          <p className="px-3 pt-2 text-xs text-white/50">{user?.email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 bg-brand-900 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href="/admin" className="[&_span]:!text-white" />
            <IconButton icon={menu ? "x" : "menu"} label="Menu" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMenu((m) => !m)} />
          </div>
          {menu && (
            <div className="space-y-2 px-3 pb-3">
              {nav}
              <div className="flex gap-2">
                <LinkButton href="/app/grade" size="sm">Teacher app</LinkButton>
                <Button size="sm" onClick={() => { actions.logout(); router.push("/"); }}>Sign out</Button>
              </div>
            </div>
          )}
        </header>
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
          {children}
          <div className="mt-10 border-t border-line pt-4 text-xs text-ink-3">
            Demo data resets any time.{" "}
            <button
              type="button"
              className="font-semibold text-brand-600 hover:underline"
              onClick={() => {
                actions.resetDemo();
                toast("Demo data reset");
                router.push("/login");
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
