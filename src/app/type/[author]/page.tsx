import type { Metadata } from "next";
import Link from "next/link";
import { quotes } from "@/data/quotes";
import SiteHeader from "@/components/SiteHeader";

interface Props {
  params: { author: string };
}

export function generateStaticParams() {
  const seen = new Set<string>();
  return quotes
    .filter((q) => {
      if (seen.has(q.authorSlug)) return false;
      seen.add(q.authorSlug);
      return true;
    })
    .map((q) => ({ author: q.authorSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const first = quotes.find((q) => q.authorSlug === params.author);
  if (!first) {
    return { title: "author not found | Typoko" };
  }
  return {
    title: `${first.author} Typing Test | Typoko`,
    description: `Type passages from ${first.author} on Typoko. Improve your WPM with real literature.`,
  };
}

export default function AuthorPage({ params }: Props) {
  const authorQuotes = quotes.filter((q) => q.authorSlug === params.author);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {authorQuotes.length === 0 ? (
          <p className="font-mono text-muted text-sm">author not found.</p>
        ) : (
          <div className="w-full max-w-2xl flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs text-muted tracking-widest">author</p>
              <h1 className="font-mono text-xl text-text font-bold">
                {authorQuotes[0].author}
              </h1>
              <p className="font-mono text-xs text-subtle">
                {authorQuotes.length}{" "}
                {authorQuotes.length === 1 ? "passage" : "passages"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {authorQuotes.map((q) => (
                <Link
                  key={q.id}
                  href={`/type/${q.authorSlug}/${q.passageSlug}`}
                  className="flex flex-col gap-2 p-4 bg-surface border border-border rounded hover:border-accent/50 transition-colors group"
                >
                  <span className="font-mono text-sm text-text font-bold group-hover:text-accent transition-colors">
                    {q.source}
                  </span>
                  <span className="font-mono text-xs text-subtle leading-relaxed">
                    {q.text.slice(0, 100)}...
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/"
              className="font-mono text-xs text-muted hover:text-subtle transition-colors w-fit"
            >
              ← back to typoko
            </Link>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
