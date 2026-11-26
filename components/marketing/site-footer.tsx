import Link from "next/link";
import { Logo } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-ink-2">Rubric grading that keeps teachers out of spreadsheets.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm" aria-label="Footer">
          <Link href="/#features" className="text-ink-2 hover:text-ink">Features</Link>
          <Link href="/login" className="text-ink-2 hover:text-ink">Try it free</Link>
          <Link href="/pricing" className="text-ink-2 hover:text-ink">Pricing</Link>
          <Link href="/login" className="text-ink-2 hover:text-ink">Log in</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-3">
        FlexGrades prototype. Accounts and billing are simulated in your browser.
      </div>
    </footer>
  );
}
