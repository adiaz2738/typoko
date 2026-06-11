import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { posts } from "@/data/posts";

export const metadata: Metadata = {
  title: "blog | Typoko",
  description:
    "Tips, deep dives, and reading lists for typing practice — from literary typing tests to tracking your progress over time.",
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndexPage() {
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-xl text-text font-bold">blog</h1>
            <p className="font-mono text-xs text-muted">
              notes on typing, reading, and getting faster at both.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {sorted.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-2 border-b border-border pb-8 last:border-b-0 last:pb-0"
              >
                <p className="font-mono text-xs text-muted">{formatDate(post.date)}</p>
                <h2 className="font-mono text-base text-text font-bold group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="font-mono text-sm text-subtle leading-relaxed">{post.excerpt}</p>
                <span className="font-mono text-xs text-accent">read more →</span>
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
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
