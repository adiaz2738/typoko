import type { Metadata } from "next";
import Link from "next/link";
import { quotes } from "@/data/quotes";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "library | Typoko",
  description:
    "Browse all passages and authors on Typoko. Type great literature by Poe, Orwell, Austen, Milton, and more.",
};

function groupByAuthor() {
  const map = new Map<
    string,
    { author: string; authorSlug: string; passages: typeof quotes }
  >();
  for (const q of quotes) {
    if (!map.has(q.authorSlug)) {
      map.set(q.authorSlug, {
        author: q.author,
        authorSlug: q.authorSlug,
        passages: [],
      });
    }
    map.get(q.authorSlug)!.passages.push(q);
  }
  return Array.from(map.values()).sort((a, b) => a.author.localeCompare(b.author));
}

export default function LibraryPage() {
  const authors = groupByAuthor();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-xl text-text font-bold">library</h1>
            <p className="font-mono text-xs text-muted">
              {quotes.length} passages &nbsp;·&nbsp; {authors.length} authors
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {authors.map(({ author, authorSlug, passages }) => (
              <div key={authorSlug} className="flex flex-col gap-3">
                <Link
                  href={`/type/${authorSlug}`}
                  className="font-mono text-sm text-text font-bold hover:text-accent transition-colors w-fit"
                >
                  {author}
                </Link>
                <div className="flex flex-col gap-2 pl-4 border-l border-border">
                  {passages.map((q) => (
                    <Link
                      key={q.id}
                      href={`/type/${q.authorSlug}/${q.passageSlug}`}
                      className="font-mono text-xs text-subtle hover:text-text transition-colors w-fit"
                    >
                      {q.source}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

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
