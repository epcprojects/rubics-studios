"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, IconButton, LinkButton, Logo } from "@/components/ui";
import { useSession } from "@/lib/store";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { user, hydrated, isAdmin } = useSession();
  const [open, setOpen] = useState(false);

  const cta =
    hydrated && user ? (
      <LinkButton href={isAdmin ? "/admin" : "/app"} variant="primary" size="sm">
        {isAdmin ? "Admin" : "Open app"}
        <Icon name="arrowRight" className="size-3.5" />
      </LinkButton>
    ) : (
      <>
        <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
          Log in
        </Link>
        <LinkButton href="/login" variant="primary" size="sm">
          Try it free
        </LinkButton>
      </>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-surface hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1 md:flex">{cta}</div>
        <IconButton icon={open ? "x" : "menu"} label="Menu" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} />
      </div>
      {open && (
        <div className="animate-fade border-t border-line bg-surface px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 text-sm font-semibold text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">{cta}</div>
        </div>
      )}
    </header>
  );
}
