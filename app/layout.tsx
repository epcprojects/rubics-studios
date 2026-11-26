import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// One typeface for the whole app (variable font, weights 200 to 800).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlexGrades: rubric grading for teachers",
    template: "%s | FlexGrades",
  },
  description:
    "Grade with a click. Build or generate rubrics, score every student, add feedback in text or voice, and send grades to your gradebook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
