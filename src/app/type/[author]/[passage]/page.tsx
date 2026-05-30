import type { Metadata } from "next";
import Link from "next/link";
import { quotes } from "@/data/quotes";
import PassageTypingTest from "@/components/PassageTypingTest";
import SiteHeader from "@/components/SiteHeader";

interface Props {
  params: { author: string; passage: string };
}

export function generateStaticParams() {
  return quotes.map((q) => ({
    author: q.authorSlug,
    passage: q.passageSlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quote = quotes.find(
    (q) => q.authorSlug === params.author && q.passageSlug === params.passage
  );
  if (!quote) {
    return { title: "passage not found | Typoko" };
  }
  return {
    title: `Type '${quote.source}' by ${quote.author} | Typoko`,
    description: `Practice typing with a passage from ${quote.source} by ${quote.author}. Improve your WPM with real literature on Typoko.`,
  };
}

export default function PassagePage({ params }: Props) {
  const quote = quotes.find(
    (q) => q.authorSlug === params.author && q.passageSlug === params.passage
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        {!quote ? (
          <p className="font-mono text-muted text-sm">passage not found.</p>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs text-muted tracking-widest">passage</p>
              <h1 className="font-mono text-xl text-text font-bold">{quote.source}</h1>
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
            </div>

            <PassageTypingTest quote={quote} />
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
