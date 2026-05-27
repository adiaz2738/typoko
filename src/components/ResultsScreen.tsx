"use client";

import { useEffect } from "react";
import { Quote } from "@/data/quotes";

interface ResultsProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  correctChars: number;
  incorrectChars: number;
  quote: Quote | null;
  onRetry: () => void;
  onNext: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function getWpmLabel(wpm: number): string {
  if (wpm >= 120) return "Exceptional";
  if (wpm >= 80) return "Advanced";
  if (wpm >= 50) return "Proficient";
  if (wpm >= 30) return "Average";
  return "Beginner";
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 98) return "text-correct";
  if (accuracy >= 90) return "text-accent";
  return "text-incorrect";
}

export default function ResultsScreen({
  wpm,
  accuracy,
  elapsedSeconds,
  correctChars,
  incorrectChars,
  quote,
  onRetry,
  onNext,
}: ResultsProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onNext();
      } else if (e.key === "Tab") {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onRetry]);

  return (
    <div className="fade-in flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4">
      {/* Main stats */}
      <div className="grid grid-cols-3 gap-6 w-full">
        <StatCard
          label="wpm"
          value={wpm.toString()}
          sub={getWpmLabel(wpm)}
          highlight
        />
        <StatCard
          label="accuracy"
          value={`${accuracy}%`}
          sub={`${correctChars} correct`}
          className={getAccuracyColor(accuracy)}
        />
        <StatCard
          label="time"
          value={formatTime(elapsedSeconds)}
          sub={`${incorrectChars} errors`}
        />
      </div>

      {/* Quote attribution */}
      {quote && (
        <div className="w-full bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-text/70 text-sm font-mono italic mb-2">
            &ldquo;{quote.text.slice(0, 120)}{quote.text.length > 120 ? "…" : ""}&rdquo;
          </p>
          <p className="text-subtle text-xs">— {quote.author}</p>
          <a
            href={quote.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-accent text-xs hover:underline"
          >
            {quote.source} →
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-surface border border-border rounded-lg text-text font-mono text-sm hover:border-accent hover:text-accent transition-colors"
        >
          retry
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          next →
        </button>
      </div>

      <p className="text-subtle text-xs font-mono">
        <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text">
          Tab
        </kbd>{" "}
        retry &nbsp;·&nbsp;{" "}
        <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text">
          Enter
        </kbd>{" "}
        next
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  className?: string;
}

function StatCard({ label, value, sub, highlight, className }: StatCardProps) {
  return (
    <div className="flex flex-col items-center bg-surface border border-border rounded-xl p-5 gap-1">
      <span className="text-subtle text-xs font-mono uppercase tracking-widest">
        {label}
      </span>
      <span
        className={`text-4xl font-bold font-mono ${
          highlight ? "text-accent" : className ?? "text-text"
        }`}
      >
        {value}
      </span>
      <span className="text-subtle text-xs font-mono">{sub}</span>
    </div>
  );
}
