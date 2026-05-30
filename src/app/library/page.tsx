import type { Metadata } from "next";
import Link from "next/link";
import { quotes } from "@/data/quotes";
import SiteHeader from "@/components/SiteHeader";
import LibrarySearch from "./LibrarySearch";

export const metadata: Metadata = {
  title: "library | Typoko",
  description:
    "Browse all passages and authors on Typoko. Type great literature by Poe, Orwell, Austen, Milton, and more.",
};

const authorCount = new Set(quotes.map((q) => q.authorSlug)).size;

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-xl text-text font-bold">library</h1>
            <p className="font-mono text-xs text-muted">
              {quotes.length} passages &nbsp;·&nbsp; {authorCount} authors
            </p>
          </div>

          <LibrarySearch />

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
