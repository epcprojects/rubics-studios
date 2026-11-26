"use client";

import { useToasts, type ToastTone } from "@/lib/toast";
import { Icon } from "./icons";

const TONE: Record<ToastTone, string> = {
  ok: "bg-ok text-white",
  warn: "bg-warn text-white",
  bad: "bg-bad text-white",
  pro: "bg-accent text-white",
};

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-pop pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-pop ${TONE[t.tone]}`}
        >
          <Icon name={t.tone === "ok" || t.tone === "pro" ? "check" : "info"} className="size-4" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
