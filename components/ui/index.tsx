"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export { Icon };
export type { IconName };

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

// ───────────────────────── Buttons ─────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger" | "pro" | "success" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:border-brand-200 hover:bg-brand-50",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2",
  danger: "bg-bad-bg text-bad hover:bg-bad hover:text-white",
  pro: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  success: "bg-ok text-white hover:brightness-95",
  dark: "bg-ink text-white hover:bg-ink/85",
};
const SIZE: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "h-12 gap-2 rounded-lg px-6 text-base",
};

interface BtnCommon {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  className?: string;
  children?: ReactNode;
}

const base =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: BtnCommon & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx(base, VARIANT[variant], SIZE[size], className)} {...rest}>
      {icon && <Icon name={icon} className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
}: BtnCommon & { href: string }) {
  return (
    <Link href={href} className={cx(base, VARIANT[variant], SIZE[size], className)}>
      {icon && <Icon name={icon} className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </Link>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...rest
}: { icon: IconName; label: string; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} className="size-4" />
    </button>
  );
}

// ───────────────────────── Surfaces ─────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl border border-line bg-surface p-4 shadow-card", className)}>{children}</div>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{children}</h3>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <Icon name={icon} className="size-5" />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ───────────────────────── Form controls ─────────────────────────

export const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand-600 focus:bg-surface disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="block">
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-3">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand-600" : "bg-line",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode }>;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cx("inline-flex rounded-lg border border-line bg-surface-2 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-[10px] font-semibold transition-colors",
            size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
            value === o.value ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface-2 text-ink-2 hover:border-brand-200",
      )}
    >
      {children}
    </button>
  );
}

// ───────────────────────── Badges & meters ─────────────────────────

type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "pro";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border border-line",
  brand: "bg-brand-50 text-brand-700",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  pro: "bg-warn-bg text-warn",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  return plan === "pro" ? (
    <Badge tone="pro">
      <Icon name="star" className="size-3" />
      PRO
    </Badge>
  ) : (
    <Badge tone="brand">FREE</Badge>
  );
}

export function ProgressBar({ value, max = 100, tone = "brand" }: { value: number; max?: number; tone?: "brand" | "warn" | "bad" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = tone === "bad" ? "bg-bad" : tone === "warn" ? "bg-warn" : "bg-sage";
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 overflow-hidden rounded-full bg-line"
    >
      <div className={cx("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GradePill({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-ink-3">—</span>;
  const tone =
    grade === "A" ? "bg-ok-bg text-ok" : grade === "B" ? "bg-brand-100 text-brand-700" : grade === "C" ? "bg-warn-bg text-warn" : "bg-bad-bg text-bad";
  return <span className={cx("inline-block min-w-7 rounded-full px-2 py-0.5 text-center text-[11px] font-bold", tone)}>{grade}</span>;
}

// ───────────────────────── Modal ─────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input, textarea, select, button[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="no-print animate-fade fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "animate-pop flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5">
          <h2 id={titleId} className="font-display text-xl font-bold tracking-tight">
            {title}
          </h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ───────────────────────── Brand ─────────────────────────

/** The client's mark: a green tile, tilted, with a serif "f". */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid h-9 w-[34px] shrink-0 -rotate-6 place-items-center rounded-[10px] bg-brand-600 font-display text-[23px] leading-none text-white",
        className,
      )}
    >
      f
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="FlexGrades home" className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[23px] font-bold tracking-[-1px] text-ink">
        flexgrades<span className="text-[#89a177]">.</span>
      </span>
    </Link>
  );
}

export function Dots({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-accent" role="status">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-1.5 rounded-full bg-accent"
            style={{ animation: "dot-bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

export { cx };
