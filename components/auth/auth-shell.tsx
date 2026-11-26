import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, Logo } from "@/components/ui";

const POINTS = ["Click-to-score rubrics with instant letter grades", "Comment bank in English and Spanish", "Export to CSV, or sync to your gradebook on Pro"];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-ink-3 hover:text-ink">
            Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-[#eaf0e4] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Your next good lesson starts here</p>
          <p className="mt-3 max-w-md font-display text-5xl leading-[1.05] text-ink">Fair grades. Thoughtful feedback.</p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-ink-2">
                <span className="grid size-6 place-items-center rounded-full bg-brand-100 text-brand-600">
                  <Icon name="check" className="size-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        {/* paper art, after the welcome card in the client's design */}
        <div aria-hidden className="relative mt-10 h-64">
          <div className="absolute top-8 right-4 h-56 w-44 rotate-[20deg] rounded-[5px] border border-[#d7decd] bg-[#d0ddbf]" />
          <div className="absolute top-4 right-16 h-56 w-48 rotate-[10deg] rounded-[5px] border border-[#d7decd] bg-[#fffef8] p-5 shadow-[0_7px_15px_rgb(41_75_52/0.08)]">
            <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Blind contour portrait</p>
            <p className="mt-1 font-display text-2xl leading-tight">A clear point of view.</p>
            <div className="mt-3 h-20 bg-[repeating-linear-gradient(0deg,transparent_0_21px,#e3e8dc_21px_22px)]" />
            <p className="font-display text-3xl text-sage">B ✓</p>
          </div>
          <div className="absolute top-8 right-12 grid size-12 -rotate-[10deg] place-items-center rounded-full border-[5px] border-[#eaf0e4] bg-[#efb18d] text-xl text-[#5b5439]">✓</div>
        </div>
      </aside>
    </div>
  );
}
