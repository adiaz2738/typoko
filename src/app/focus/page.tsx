import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import FocusModeTest from "@/components/FocusModeTest";

export const metadata: Metadata = {
  title: "Focus Mode | Accuracy Typing Training | Typoko",
  description:
    "Typing test for dyslexia, typing practice for reading difficulties, accuracy typing training. No timer, no pressure — errors must be corrected before continuing. Real literature, real challenge.",
  keywords: [
    "typing test for dyslexia",
    "typing practice for reading difficulties",
    "accuracy typing training",
    "focus mode typing test",
    "corrective typing practice",
    "typoko",
  ],
  openGraph: {
    title: "Focus Mode | Accuracy Typing Training | Typoko",
    description:
      "Accuracy-first typing practice. Errors must be corrected before continuing — no timer, no pressure. Real literature.",
    type: "website",
  },
};

export default function FocusPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl flex flex-col gap-8">
          {/* Page header */}
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted tracking-widest uppercase">
              accuracy training
            </p>
            <h1 className="font-mono text-xl text-text font-bold">focus mode</h1>
            <p className="font-mono text-xs text-subtle">
              errors must be corrected before continuing &nbsp;·&nbsp; no timer &nbsp;·&nbsp; accuracy over speed
            </p>
          </div>

          {/* Typing test */}
          <FocusModeTest />

          <Link
            href="/"
            className="font-mono text-xs text-muted hover:text-subtle transition-colors w-fit"
          >
            ← back to typoko
          </Link>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
