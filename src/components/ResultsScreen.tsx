"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "@/data/quotes";
import {
  MAX_NICKNAME_LENGTH,
  getBestScoreForNickname,
  getNickname,
  notifyDailyScoreSubmitted,
  setNickname,
  submitDailyScore,
} from "@/utils/dailyLeaderboard";

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
      <span style={{ color: "#7a7a96", fontSize: 13 }}>{getWpmLabel(wpm)}</span>
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

function NicknameModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (nickname: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <p className="font-mono text-sm text-text">choose a nickname</p>
          <p className="font-mono text-xs text-subtle">max {MAX_NICKNAME_LENGTH} characters · saved for future visits</p>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_NICKNAME_LENGTH))}
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder="your nickname"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex-1 px-4 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            submit score
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-subtle font-mono text-sm hover:border-accent hover:text-accent transition-colors"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  );
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
  flawlessFailed,
  charsBeforeFail = 0,
  note,
  dailyMode = false,
}: ResultsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

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

  async function handleSave() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0f0f13",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "typoko-results.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  }

  function saveScoreWithNickname(nickname: string) {
    setNickname(nickname);
    submitDailyScore(wpm, accuracy, nickname);
    notifyDailyScoreSubmitted();
    setScoreSubmitted(true);
    setShowNicknameModal(false);
  }

  function handleSubmitScore() {
    const saved = getNickname();
    if (saved) {
      saveScoreWithNickname(saved);
    } else {
      setShowNicknameModal(true);
    }
  }

  const existingNickname = getNickname();
  const priorBest = existingNickname ? getBestScoreForNickname(existingNickname) : null;
  const beatsOrTiesPriorBest = !priorBest || wpm >= priorBest.wpm;

  const submitScoreButton = dailyMode && !flawlessFailed && beatsOrTiesPriorBest && (
    scoreSubmitted ? (
      <p className="font-mono text-sm text-accent">score submitted ✓</p>
    ) : (
      <button
        onClick={handleSubmitScore}
        className="px-6 py-2.5 bg-surface border border-accent rounded-lg text-accent font-mono text-sm hover:bg-accent/10 transition-colors"
      >
        submit score
      </button>
    )
  );

  const saveButton = (
    <button
      onClick={handleSave}
      disabled={saving}
      className="px-6 py-2.5 bg-surface border border-border rounded-lg text-subtle font-mono text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
    >
      {saving ? "saving…" : "save image"}
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
      {saveButton}
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

  if (flawlessFailed) {
    const estimatedWords = Math.floor(charsBeforeFail / 5);
    return (
      <>
      {showNicknameModal && (
        <NicknameModal
          onSubmit={saveScoreWithNickname}
          onCancel={() => setShowNicknameModal(false)}
        />
      )}
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

        {/* Share card */}
        <div ref={cardRef}>
          <ShareCard wpm={wpm} accuracy={accuracy} quote={quote} />
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
    {showNicknameModal && (
      <NicknameModal
        onSubmit={saveScoreWithNickname}
        onCancel={() => setShowNicknameModal(false)}
      />
    )}
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

      {/* Share card */}
      <div ref={cardRef}>
        <ShareCard wpm={wpm} accuracy={accuracy} quote={quote} />
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
