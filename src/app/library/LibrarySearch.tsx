"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { quotes, type Quote } from "@/data/quotes";

function groupByAuthor(qs: Quote[]) {
  const map = new Map<string, { author: string; authorSlug: string; passages: Quote[] }>();
  for (const q of qs) {
    if (!map.has(q.authorSlug)) {
      map.set(q.authorSlug, { author: q.author, authorSlug: q.authorSlug, passages: [] });
    }
    map.get(q.authorSlug)!.passages.push(q);
  }
  return Array.from(map.values()).sort((a, b) => a.author.localeCompare(b.author));
}

export default function LibrarySearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (quote) =>
        quote.author.toLowerCase().includes(q) ||
        quote.source.toLowerCase().includes(q) ||
        quote.text.toLowerCase().includes(q)
    );
  }, [query]);

  const authors = useMemo(() => groupByAuthor(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search passages, authors, books..."
          className="w-full bg-surface border border-border rounded px-4 py-3 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted hover:text-text transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {authors.length === 0 ? (
        <p className="font-mono text-sm text-muted">no results found.</p>
      ) : (
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
      )}
    </div>
  );
}
