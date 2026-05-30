import type { Metadata } from "next";
import Link from "next/link";
import { quotes } from "@/data/quotes";
import PassageTypingTest from "@/components/PassageTypingTest";
import SiteHeader from "@/components/SiteHeader";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "today's passage | Typoko",
  description:
    "Type today's featured passage on Typoko. A new passage every day — real literature, real challenge.",
};

function getDailyQuote() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const seed = parseInt(`${year}${month}${day}`, 10);
  return quotes[seed % quotes.length];
}

function formatDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toLowerCase();
}

export default function DailyPage() {
  const quote = getDailyQuote();
  const dateString = formatDate(new Date());

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted tracking-widest">daily challenge</p>
            <h1 className="font-mono text-xl text-text font-bold">today's passage</h1>
            <p className="font-mono text-xs text-subtle">{dateString}</p>
          </div>

          <div className="flex items-center gap-4">
            <p className="font-mono text-sm text-subtle">{quote.author}</p>
            <a
              href={quote.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-muted hover:text-subtle transition-colors"
            >
              get the book →
            </a>
          </div>

          <PassageTypingTest
            quote={quote}
            resultsNote="come back tomorrow for a new passage"
          />

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
