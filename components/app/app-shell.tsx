"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Field, Icon, IconButton, Logo, Modal, PlanBadge, ProgressBar, inputCls, cx, type IconName } from "@/components/ui";
import { PLANS } from "@/lib/plans";
import { actions, useSession, useWorkspace } from "@/lib/store";
import { toast } from "@/lib/toast";

const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/app", label: "Overview", icon: "home" },
  { href: "/app/grade", label: "Grade", icon: "clipboard" },
  { href: "/app/rubrics", label: "Rubrics", icon: "grid" },
  { href: "/app/gradebook", label: "Gradebook", icon: "chart" },
  { href: "/app/billing", label: "Plan & billing", icon: "card" },
];

/** "/app" is the Overview and must only match exactly; the other items match their sub-routes. */
const isActive = (pathname: string, href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, user, plan, isGuest } = useSession();
  const ws = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const limits = PLANS[plan].limits;
  const display = user?.name ?? ws.teacherName;

  return (
    <>
      {/*
        The page is always rendered so Next can validate the route, but it stays invisible until the
        browser has read the saved session. Otherwise a signed-in teacher would flash the guest workspace.
      */}
      {!hydrated && (
        <div role="status" className="fixed inset-0 z-50 grid place-items-center bg-bg">
          <div className="flex items-center gap-3 text-sm font-semibold text-ink-3">
            <span className="size-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            Loading your workspace
          </div>
        </div>
      )}
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]" aria-hidden={!hydrated}>
      {/* desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-line bg-sidebar lg:flex">
        <div className="px-5 pt-5 pb-4">
          <Logo href="/app" />
        </div>
        <p className="px-6 pb-3 text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Teacher workspace</p>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-3 p-3">
          {plan === "free" && (
            <div className="rounded-[10px] bg-[#e4ebde] p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Free plan</p>
              <Meter label="Rubrics" value={ws.rubrics.length} max={limits.rubrics} />
              <Meter label="Students" value={ws.students.length} max={limits.students} />
              <Link
                href={user ? "/app/billing?upgrade=1" : "/signup?plan=pro"}
                className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d2ddcc] bg-white text-xs font-semibold text-brand-600 hover:bg-brand-50"
              >
                <Icon name="star" className="size-3.5" />
                Upgrade to Pro
              </Link>
            </div>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-2"
            >
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {display.replace(/^(ms|mr|mrs|dr)\.?\s+/i, "").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{display}</span>
                <span className="mt-0.5 block">
                  <PlanBadge plan={plan} />
                </span>
              </span>
              <Icon name="chevronDown" className="size-4 text-ink-3" />
            </button>
            {menu && (
              <div className="animate-pop absolute bottom-full left-0 mb-2 w-full rounded-lg border border-line bg-surface p-1 shadow-pop">
                <MenuItem
                  icon="edit"
                  onClick={() => {
                    setMenu(false);
                    setNameDraft(display);
                    setNameOpen(true);
                  }}
                >
                  Edit name
                </MenuItem>
                {user?.role === "admin" && (
                  <MenuItem icon="shield" onClick={() => router.push("/admin")}>
                    Admin console
                  </MenuItem>
                )}
                {user ? (
                  <MenuItem
                    icon="logout"
                    onClick={() => {
                      actions.logout();
                      setMenu(false);
                      router.push("/");
                    }}
                  >
                    Sign out
                  </MenuItem>
                ) : (
                  <MenuItem icon="user" onClick={() => router.push("/login")}>
                    Sign in
                  </MenuItem>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* desktop top bar: breadcrumb, plan, account */}
        <div className="no-print hidden h-16 items-center justify-between gap-4 border-b border-line bg-white/60 px-10 lg:flex">
          <p className="flex items-center gap-2.5 text-xs text-ink-3">
            Workspace <span>/</span>
            <span className="text-ink-2">{NAV.find((n) => isActive(pathname, n.href))?.label ?? "Overview"}</span>
          </p>
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            {user ? (
              <Link href="/app/billing" className="rounded-[7px] border border-line bg-white px-3.5 py-2 text-xs font-medium hover:bg-brand-50">
                My account
              </Link>
            ) : (
              <Link href="/login" className="rounded-[7px] border border-line bg-white px-3.5 py-2 text-xs font-medium hover:bg-brand-50">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* mobile top bar */}
        <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href="/app" />
            <div className="flex items-center gap-1">
              <PlanBadge plan={plan} />
              <IconButton icon={menu ? "x" : "menu"} label="Menu" onClick={() => setMenu((m) => !m)} aria-expanded={menu} />
            </div>
          </div>
          {menu && (
            <div className="animate-fade border-t border-line px-2 pb-3">
              <div className="mt-3 flex flex-wrap gap-2 px-2">
                <Button size="sm" variant="secondary" icon="edit" onClick={() => { setMenu(false); setNameDraft(display); setNameOpen(true); }}>
                  Edit name
                </Button>
                {user ? (
                  <Button size="sm" variant="secondary" icon="logout" onClick={() => { actions.logout(); setMenu(false); router.push("/"); }}>
                    Sign out
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => router.push("/login")}>
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          )}
        </header>

        {isGuest && (
          <div className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand-900 px-4 py-2 text-center text-xs text-white">
            <span>You are using FlexGrades as a guest. Your work is saved in this browser only.</span>
            <Link href="/signup" className="font-bold underline underline-offset-2">
              Create a free account
            </Link>
          </div>
        )}

        <div key={pathname} className="animate-enter mx-auto max-w-[1440px] px-4 pt-5 pb-28 sm:px-6 lg:pb-12">
          {children}
        </div>

        {/* mobile bottom navigation, as in the client's design */}
        <nav aria-label="App" className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium",
                  active ? "text-brand-600" : "text-ink-3",
                )}
              >
                <Icon name={n.icon} className="size-5" />
                {n.label === "Plan & billing" ? "Plan" : n.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Modal
        open={nameOpen}
        onClose={() => setNameOpen(false)}
        title="Edit your name"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNameOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!nameDraft.trim()) return;
                actions.setTeacherName(nameDraft);
                setNameOpen(false);
                toast("Name updated");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Your name" htmlFor="teacher-name">
          <input
            id="teacher-name"
            className={inputCls}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameDraft.trim()) {
                actions.setTeacherName(nameDraft);
                setNameOpen(false);
                toast("Name updated");
              }
            }}
          />
        </Field>
      </Modal>
    </div>
    </>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="App">
      {NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-brand-100 text-brand-600" : "text-ink-2 hover:bg-brand-50 hover:text-ink",
            )}
          >
            <Icon name={n.icon} className="size-[18px]" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  const tone = value >= max ? "bad" : value >= max * 0.8 ? "warn" : "brand";
  return (
    <div className="mt-2.5">
      <div className="mb-1 flex justify-between text-[11px] text-ink-2">
        <span>{label}</span>
        <span className="font-semibold">
          {value} / {max}
        </span>
      </div>
      <ProgressBar value={value} max={max} tone={tone} />
    </div>
  );
}

function MenuItem({ icon, onClick, children }: { icon: IconName; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-surface-2">
      <Icon name={icon} className="size-4 text-ink-3" />
      {children}
    </button>
  );
}
