"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "@/data/quotes";
import { getTodayDateKey, notifyDailyScoreSubmitted } from "@/utils/dailyLeaderboard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface ResultsProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  correctChars: number;
  incorrectChars: number;
  quote: Quote | null;
  onRetry: () => void;
  onNext: () => void;
  flawlessFailed?: boolean;
  charsBeforeFail?: number;
  note?: string;
  dailyMode?: boolean;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function getWpmLabel(wpm: number): string {
  if (wpm >= 101) return "dayum.";
  if (wpm >= 91) return "impressive.";
  if (wpm >= 71) return "ok, I see you.";
  if (wpm >= 51) return "not bad.";
  if (wpm >= 31) return "you'll get there.";
  return "oof.";
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 98) return "text-correct";
  if (accuracy >= 90) return "text-accent";
  return "text-incorrect";
}

interface ShareCardProps {
  wpm: number;
  accuracy: number;
  quote: Quote | null;
}

const ShareCard = ({ wpm, accuracy, quote }: ShareCardProps) => (
  <div
    style={{
      width: 420,
      background: "#0f0f13",
      border: "1px solid #2a2a36",
      borderRadius: 16,
      padding: "32px 36px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 20,
      fontFamily: "'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
    }}
  >
    {/* Brand */}
    <span style={{ color: "#e2b714", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em" }}>
      typoko
    </span>

    {/* WPM */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ color: "#7a7a96", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>
        wpm
      </span>
      <span style={{ color: "#e2b714", fontSize: 64, fontWeight: 700, lineHeight: 1 }}>
        {wpm}
      </span>
      <span style={{ color: "#7a7a96", fontSize: 13, marginTop: 10 }}>{getWpmLabel(wpm)}</span>
    </div>

    {/* Accuracy */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ color: "#7a7a96", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>
        accuracy
      </span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accuracy >= 98 ? "#4ade80" : accuracy >= 90 ? "#e2b714" : "#f87171",
        }}
      >
        {accuracy}%
      </span>
    </div>

    {/* Divider */}
    <div style={{ width: "100%", height: 1, background: "#2a2a36" }} />

    {/* Passage info */}
    {quote ? (
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ color: "#d1d1e0", fontSize: 13, fontStyle: "italic" }}>
          {quote.source}
        </span>
        <span style={{ color: "#7a7a96", fontSize: 12 }}>— {quote.author}</span>
      </div>
    ) : (
      <span style={{ color: "#7a7a96", fontSize: 13 }}>words mode</span>
    )}

    {/* Footer */}
    <span style={{ color: "#e2b714", fontSize: 15, fontWeight: 700, letterSpacing: "0.05em" }}>typoko.com</span>
  </div>
);

export default function ResultsScreen({
  wpm,
  accuracy,
  elapsedSeconds,
  correctChars,
  incorrectChars,
  quote,
  onRetry,
  onNext,
  flawlessFailed,
  charsBeforeFail = 0,
  note,
  dailyMode = false,
}: ResultsProps) {
  const { user, loading: authLoading } = useAuth();
  // Ref to the off-screen card — captured by html2canvas, never shown in-page
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingScore, setExistingScore] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [checkingScore, setCheckingScore] = useState(false);

  useEffect(() => {
    if (!dailyMode || !user) return;
    setCheckingScore(true);
    supabase
      .from("daily_scores")
      .select("wpm, accuracy")
      .eq("user_id", user.id)
      .eq("date", getTodayDateKey())
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExistingScore(data);
        setCheckingScore(false);
      });
  }, [dailyMode, user]);

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

  async function handleShare() {
    if (!hiddenCardRef.current || sharing) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(hiddenCardRef.current, {
        backgroundColor: "#0f0f13",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // On touch devices, prefer the Web Share API so users can post to social media
      // or save directly to camera roll. Fall back to PNG download on desktop.
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice && typeof navigator.share === "function") {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          const file = new File([blob], "typoko-results.png", { type: "image/png" });
          const canShareFile =
            typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
          if (canShareFile) {
            await navigator.share({ files: [file], title: "My Typoko Results" });
            return;
          }
        }
      }

      // Desktop or fallback: trigger PNG download
      const link = document.createElement("a");
      link.download = "typoko-results.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: unknown) {
      // AbortError means the user dismissed the share sheet — not a real error
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleSubmitScore() {
    if (!user || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      user_id: user.id,
      date: getTodayDateKey(),
      wpm,
      accuracy,
      quote_id: quote?.id ?? null,
    };
    console.log("[daily score] submitting:", payload);
    const { error } = await supabase.from("daily_scores").insert(payload);
    if (error) {
      console.error("[daily score] insert failed:", error.message, error.details, error.hint, error.code);
      setSubmitError(`submit failed: ${error.message}`);
    } else {
      console.log("[daily score] insert succeeded");
      setScoreSubmitted(true);
      notifyDailyScoreSubmitted();
    }
    setSubmitting(false);
  }

  let submitScoreButton: React.ReactNode = null;
  if (dailyMode && !flawlessFailed) {
    if (authLoading || checkingScore) {
      submitScoreButton = (
        <p className="font-mono text-xs text-subtle">loading…</p>
      );
    } else if (!user) {
      submitScoreButton = (
        <p className="font-mono text-sm text-subtle">
          sign in to submit your score
        </p>
      );
    } else if (scoreSubmitted) {
      submitScoreButton = (
        <p className="font-mono text-sm text-accent">score submitted ✓</p>
      );
    } else if (existingScore) {
      submitScoreButton = (
        <p className="font-mono text-sm text-subtle">
          your score:{" "}
          <span className="text-accent font-semibold">{existingScore.wpm} wpm</span>
          {" "}· {existingScore.accuracy}% acc — already submitted today
        </p>
      );
    } else {
      submitScoreButton = (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSubmitScore}
            disabled={submitting}
            className="px-6 py-2.5 bg-surface border border-accent rounded-lg text-accent font-mono text-sm hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {submitting ? "submitting…" : "submit score"}
          </button>
          {submitError && (
            <p className="font-mono text-xs text-incorrect">{submitError}</p>
          )}
        </div>
      );
    }
  }

  const shareButton = (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="px-6 py-2.5 bg-surface border border-border rounded-lg text-subtle font-mono text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
    >
      {sharing ? "sharing…" : "share results"}
    </button>
  );

  const actions = (
    <div className="flex flex-col items-center gap-3">
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
      {submitScoreButton}
      {shareButton}
    </div>
  );

  const keyHints = (
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
  );

  // Off-screen card rendered into the DOM so html2canvas can capture it on demand.
  // Fixed positioning + large negative left keeps it invisible without display:none
  // (which would prevent html2canvas from reading layout).
  const hiddenCard = (
    <div
      ref={hiddenCardRef}
      style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}
      aria-hidden
    >
      <ShareCard wpm={wpm} accuracy={accuracy} quote={quote} />
    </div>
  );

  if (flawlessFailed) {
    const estimatedWords = Math.floor(charsBeforeFail / 5);
    return (
      <>
        {hiddenCard}
        <div className="fade-in flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4">
          {/* Flawless fail header */}
          <div className="text-center">
            <p className="text-incorrect text-xs font-mono uppercase tracking-widest mb-3">
              flawless — failed
            </p>
            <p className="text-text text-5xl font-bold font-mono">{charsBeforeFail}</p>
            <p className="text-subtle text-sm font-mono mt-2">
              characters &nbsp;·&nbsp; ~{estimatedWords} words before first mistake
            </p>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-6 w-full">
            <StatCard
              label="wpm"
              value={wpm.toString()}
              sub={getWpmLabel(wpm)}
              highlight
            />
            <StatCard
              label="time"
              value={formatTime(elapsedSeconds)}
              sub={`${correctChars} correct`}
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

          {actions}
          {keyHints}
          {note && (
            <p className="font-mono text-xs text-text">{note}</p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {hiddenCard}
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

        {actions}
        {keyHints}
        {note && (
          <p className="font-mono text-xs text-text">{note}</p>
        )}
      </div>
    </>
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
