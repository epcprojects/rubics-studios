import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Instrument_Serif({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
