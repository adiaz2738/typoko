"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { quotes, Quote } from "@/data/quotes";

// ─── Types ───────────────────────────────────────────────────────────────────

type CharState = "pending" | "correct" | "incorrect" | "current";

interface CharData {
  char: string;
  state: CharState;
}

interface ErrorEvent {
  position: number;
  expected: string;
  got: string;
  posInWord: number;
  wordLength: number;
}

interface FocusResults {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  errorEvents: ErrorEvent[];
  text: string;
  quote: Quote;
  uniqueErrorPositions: number;
}

// ─── Passage extraction ───────────────────────────────────────────────────────

function isCleanSentenceStart(s: string): boolean {
  if (!s) return false;
  const first = s[0];
  // Capital letter start
  if (first >= "A" && first <= "Z") return true;
  // Opening quote/double-quote immediately followed by a capital letter
  if ((first === '"' || first === "“" || first === "'") && s.length > 1) {
    const second = s[1];
    return second >= "A" && second <= "Z";
  }
  return false;
}

function extractShortPassage(fullText: string): string {
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)/g;
  const allSentences = Array.from(fullText.matchAll(sentenceRegex))
    .map((m) => m[0].trim())
    .filter((s) => s.length > 20);

  // Only keep sentences that begin cleanly
  const sentences = allSentences.filter(isCleanSentenceStart);

  if (sentences.length === 0) {
    // Fallback: scan fullText for the first clean-starting sentence boundary
    const fallbackMatch = fullText.match(/(?:^|[.!?]\s+)([A-Z“"][^.!?]{60,250}[.!?])/);
    if (fallbackMatch) return fallbackMatch[1].trim();
    const chunk = fullText.slice(0, 260);
    const lastSpace = chunk.lastIndexOf(" ");
    return (lastSpace > 80 ? chunk.slice(0, lastSpace) : chunk).trim();
  }

  const startIdx = Math.floor(Math.random() * sentences.length);
  let result = "";

  for (let i = startIdx; i < sentences.length; i++) {
    const s = sentences[i];
    const candidate = result ? result + " " + s : s;

    if (candidate.length > 320) {
      if (result.length >= 120) break;
      // Truncate this sentence at a word boundary
      const maxLen = 310 - result.length;
      const truncated = s.slice(0, maxLen).replace(/\s\w+$/, "");
      result = result ? result + " " + truncated : truncated;
      break;
    }

    result = candidate;
    if (result.length >= 150) break;
  }

  return result.trim() || fullText.slice(0, 200).trim();
}

function getFocusPassage(excludeId?: number): { text: string; quote: Quote } {
  const pool = excludeId !== undefined ? quotes.filter((q) => q.id !== excludeId) : quotes;
  const quote = pool[Math.floor(Math.random() * pool.length)];
  return { text: extractShortPassage(quote.text), quote };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildChars(text: string): CharData[] {
  return text.split("").map((char, i) => ({
    char,
    state: i === 0 ? "current" : "pending",
  }));
}

function getWordInfo(position: number, text: string): { posInWord: number; wordLength: number } {
  let wordStart = position;
  while (wordStart > 0 && text[wordStart - 1] !== " ") wordStart--;
  let wordEnd = position;
  while (wordEnd < text.length && text[wordEnd] !== " ") wordEnd++;
  return { posInWord: position - wordStart, wordLength: wordEnd - wordStart };
}

function formatElapsed(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return seconds.toString();
}

// ─── Error analysis ───────────────────────────────────────────────────────────

interface ErrorReport {
  totalErrors: number;
  transpositions: number;
  startOfWord: number;
  endOfWord: number;
  substitutions: number;
  topMissedChars: [string, number][];
  observations: string[];
}

function analyzeErrors(events: ErrorEvent[], text: string, uniqueErrorPositions: number, totalChars: number): ErrorReport {
  const totalErrors = events.length;

  if (totalErrors === 0) {
    return {
      totalErrors: 0,
      transpositions: 0,
      startOfWord: 0,
      endOfWord: 0,
      substitutions: 0,
      topMissedChars: [],
      observations: ["Perfect run — no errors at all. Exceptional accuracy."],
    };
  }

  let transpositions = 0;
  let startOfWord = 0;
  let endOfWord = 0;
  let substitutions = 0;
  const missedChars: Record<string, number> = {};

  for (const ev of events) {
    const nextChar = text[ev.position + 1] ?? "";
    if (ev.got === nextChar && nextChar !== " " && nextChar !== "") {
      transpositions++;
    } else {
      substitutions++;
    }

    if (ev.posInWord === 0) startOfWord++;
    else if (ev.posInWord === ev.wordLength - 1) endOfWord++;

    if (ev.expected !== " ") {
      missedChars[ev.expected] = (missedChars[ev.expected] ?? 0) + 1;
    }
  }

  const topMissedChars = Object.entries(missedChars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const observations: string[] = [];
  const transRate = transpositions / totalErrors;
  const endRate = endOfWord / totalErrors;
  const startRate = startOfWord / totalErrors;
  const firstTryAccuracy = Math.round(((totalChars - uniqueErrorPositions) / totalChars) * 100);

  if (transRate >= 0.4) {
    observations.push("You frequently transpose adjacent letters — your fingers know the right keys but sometimes get ahead of themselves.");
  } else if (transRate >= 0.2) {
    observations.push("Some letter reversals detected — occasional transpositions of adjacent characters.");
  }

  if (endRate >= 0.4) {
    observations.push("Many errors occur at the end of words — you may be rushing to finish words before fully reading them.");
  } else if (endRate >= 0.25) {
    observations.push("You make more errors near the ends of words than at the beginning.");
  }

  if (startRate >= 0.35) {
    observations.push("You frequently mis-key the first letter of words — possible reading-onset difficulty where the eye hasn't fully registered the word before typing begins.");
  }

  if (topMissedChars.length > 0) {
    const chars = topMissedChars.slice(0, 3).map(([c]) => `"${c}"`).join(", ");
    observations.push(`Most frequently missed characters: ${chars}.`);
  }

  if (observations.length === 0) {
    observations.push("Errors are spread evenly across positions — no single dominant pattern detected.");
  }

  if (firstTryAccuracy >= 96 && totalErrors > 0) {
    observations.push("High first-try accuracy despite some errors. Strong overall execution.");
  }

  return {
    totalErrors,
    transpositions,
    startOfWord,
    endOfWord,
    substitutions,
    topMissedChars,
    observations,
  };
}

// ─── Layout constants (match TypingTest) ─────────────────────────────────────

const LINE_HEIGHT_PX = 33;
const VISIBLE_LINES = 3;
const VISIBLE_HEIGHT_PX = LINE_HEIGHT_PX * VISIBLE_LINES;
const CONTAINER_HEIGHT_PX = VISIBLE_HEIGHT_PX + 48;

// ─── Main component ───────────────────────────────────────────────────────────

export default function FocusModeTest() {
  const [chars, setChars] = useState<CharData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [scrollY, setScrollY] = useState(0);
  const [results, setResults] = useState<FocusResults | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const typingContainerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const scrollYRef = useRef(0);
  const currentIndexRef = useRef(0);
  const errorEventsRef = useRef<ErrorEvent[]>([]);
  const errorPositionsRef = useRef<Set<number>>(new Set());
  const correctRef = useRef(0);
  const currentTextRef = useRef("");
  const currentQuoteRef = useRef<Quote | null>(null);
  const startTimeRef = useRef(0);

  const loadPassage = useCallback((keepCurrent = false) => {
    let data: { text: string; quote: Quote };

    if (keepCurrent && currentTextRef.current && currentQuoteRef.current) {
      data = { text: currentTextRef.current, quote: currentQuoteRef.current };
    } else {
      data = getFocusPassage(currentQuoteRef.current?.id);
    }

    const { text, quote } = data;
    currentTextRef.current = text;
    currentQuoteRef.current = quote;
    currentIndexRef.current = 0;
    errorEventsRef.current = [];
    errorPositionsRef.current = new Set();
    correctRef.current = 0;
    elapsedRef.current = 0;
    scrollYRef.current = 0;

    setChars(buildChars(text));
    setCurrentIndex(0);
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setScrollY(0);
    setResults(null);

    if (inputRef.current) inputRef.current.value = "";
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => { loadPassage(); }, [loadPassage]);

  useEffect(() => { inputRef.current?.focus(); }, [chars]);

  useEffect(() => {
    if (!started) return;
    const isTouch = typeof window !== "undefined" && navigator.maxTouchPoints > 0;
    if (!isTouch) return;
    const id = setTimeout(() => {
      typingContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
    return () => clearTimeout(id);
  }, [started]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      const wpmVal = elapsedRef.current > 0
        ? Math.round((correctRef.current / 5) / (elapsedRef.current / 60))
        : 0;
      setLiveWpm(wpmVal);
    }, 1000);
  }, []);

  // Scroll paging — same logic as TypingTest
  useEffect(() => {
    const charEl = charRefs.current[currentIndex];
    if (!charEl) return;
    const charTop = charEl.offsetTop;
    const page = Math.floor(charTop / VISIBLE_HEIGHT_PX);
    const newScrollY = page * VISIBLE_HEIGHT_PX;
    if (newScrollY !== scrollYRef.current) {
      scrollYRef.current = newScrollY;
      setScrollY(newScrollY);
    }
  }, [currentIndex]);

  const processChar = useCallback((key: string) => {
    if (finished) return;

    const idx = currentIndexRef.current;
    const expected = chars[idx]?.char;
    if (expected === undefined) return;

    const text = currentTextRef.current;

    if (key === expected) {
      correctRef.current += 1;
      const nextIdx = idx + 1;
      currentIndexRef.current = nextIdx;

      setChars((prev) => {
        const next = [...prev];
        next[idx] = { char: expected, state: "correct" };
        if (nextIdx < next.length) {
          next[nextIdx] = { ...next[nextIdx], state: "current" };
        }
        return next;
      });

      setCurrentIndex(nextIdx);

      const uniqueErrors = errorPositionsRef.current.size;
      setLiveAccuracy(
        nextIdx > 0
          ? Math.min(100, Math.round(((nextIdx - uniqueErrors) / nextIdx) * 100))
          : 100,
      );

      if (nextIdx >= chars.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalElapsed =
          startTimeRef.current > 0
            ? (performance.now() - startTimeRef.current) / 1000
            : elapsedRef.current;
        const totalChars = chars.length;
        const wpm = Math.round((totalChars / 5) / (Math.max(1, finalElapsed) / 60));
        const uniqueErrorCount = errorPositionsRef.current.size;
        const accuracy = Math.min(
          100,
          Math.round(((totalChars - uniqueErrorCount) / totalChars) * 100),
        );

        setResults({
          wpm,
          accuracy,
          elapsedSeconds: finalElapsed,
          errorEvents: [...errorEventsRef.current],
          text,
          quote: currentQuoteRef.current!,
          uniqueErrorPositions: uniqueErrorCount,
        });
        setFinished(true);
      }
    } else {
      // Wrong key — record error, stay at position, show incorrect state
      const wordInfo = getWordInfo(idx, text);
      errorEventsRef.current.push({
        position: idx,
        expected,
        got: key,
        posInWord: wordInfo.posInWord,
        wordLength: wordInfo.wordLength,
      });
      errorPositionsRef.current.add(idx);

      setChars((prev) => {
        const next = [...prev];
        next[idx] = { char: expected, state: "incorrect" };
        return next;
      });
    }
  }, [finished, chars, currentIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        loadPassage(false);
        return;
      }

      if (finished) {
        if (e.key === "Enter") { e.preventDefault(); loadPassage(false); }
        else if (e.key === "Tab") { e.preventDefault(); loadPassage(true); }
        return;
      }

      if (!started) {
        setStarted(true);
        startTimer();
      }

      if (e.key === "Backspace") {
        const idx = currentIndexRef.current;
        const currentState = chars[idx]?.state;

        if (currentState === "incorrect") {
          // Clear the error, let them try again
          setChars((prev) => {
            const next = [...prev];
            next[idx] = { char: next[idx].char, state: "current" };
            return next;
          });
        } else {
          // Go back one position
          if (idx === 0) return;
          const prevIdx = idx - 1;
          currentIndexRef.current = prevIdx;
          setChars((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], state: "pending" };
            next[prevIdx] = { char: next[prevIdx].char, state: "current" };
            return next;
          });
          setCurrentIndex(prevIdx);
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        processChar(e.key);
      }
    },
    [finished, started, startTimer, loadPassage, chars, processChar],
  );

  // Android virtual keyboard fallback
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const value = input.value;
      input.value = "";
      if (!value) return;

      if (!started) {
        setStarted(true);
        startTimer();
      }

      for (const char of value) {
        if (char !== "\n" && char !== "\r") processChar(char);
      }
    },
    [started, startTimer, processChar],
  );

  if (finished && results) {
    return (
      <FocusResultsScreen
        results={results}
        onRetry={() => loadPassage(true)}
        onNext={() => loadPassage(false)}
      />
    );
  }

  return (
    <div ref={typingContainerRef} className="w-full flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between font-mono text-sm">
        <div className="flex items-center gap-6">
          <StatPill label="acc" value={`${liveAccuracy}%`} accent />
          <StatPill label="wpm" value={liveWpm.toString()} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-subtle font-mono text-xs uppercase tracking-widest">stopwatch</span>
          <span className="text-accent text-2xl font-bold font-mono">
            {started ? formatElapsed(elapsed) : "—"}
          </span>
        </div>
      </div>

      {/* Typing area */}
      <div
        className="relative bg-surface border border-border rounded-2xl px-6 pt-6 pb-6 cursor-text overflow-hidden"
        style={{ height: `${CONTAINER_HEIGHT_PX}px` }}
        onClick={() => inputRef.current?.focus()}
        onTouchStart={() => inputRef.current?.focus()}
      >
        <div
          className="relative font-mono text-xl leading-relaxed tracking-wide select-none"
          style={{
            transform: `translateY(-${scrollY}px)`,
            transition: scrollY === 0 ? "none" : "transform 180ms ease",
          }}
        >
          {chars.map((c, i) => {
            let color = "text-muted";
            if (c.state === "correct") color = "text-correct";
            else if (c.state === "incorrect") color = "text-incorrect";
            else if (c.state === "current") color = "text-current";

            const isCurrent = c.state === "current";
            const isError = c.state === "incorrect";

            return (
              <span
                key={i}
                ref={(el) => { charRefs.current[i] = el; }}
                className={`relative ${color}`}
              >
                {(isCurrent || isError) && (
                  <span
                    className={`absolute -left-px top-0 bottom-0 w-0.5 rounded-full ${
                      isError ? "bg-incorrect" : "bg-accent cursor-blink"
                    }`}
                    aria-hidden
                  />
                )}
                {c.char}
              </span>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          enterKeyHint="send"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onTouchStart={() => inputRef.current?.focus()}
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          aria-label="Focus mode typing input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {!started && (
        <p className="text-center text-subtle text-xs font-mono fade-in">
          start typing to begin &nbsp;·&nbsp; errors must be corrected before advancing &nbsp;·&nbsp;{" "}
          <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text/70">
            Tab
          </kbd>{" "}
          to restart
        </p>
      )}
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function FocusResultsScreen({
  results,
  onRetry,
  onNext,
}: {
  results: FocusResults;
  onRetry: () => void;
  onNext: () => void;
}) {
  const { wpm, accuracy, elapsedSeconds, errorEvents, text, quote, uniqueErrorPositions } = results;
  const report = analyzeErrors(errorEvents, text, uniqueErrorPositions, text.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onNext(); }
      else if (e.key === "Tab") { e.preventDefault(); onRetry(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onRetry]);

  function getAccuracyLabel(acc: number): string {
    if (acc === 100) return "flawless.";
    if (acc >= 97) return "excellent.";
    if (acc >= 93) return "very good.";
    if (acc >= 88) return "good.";
    if (acc >= 80) return "getting there.";
    return "keep practicing.";
  }

  function getAccuracyColor(acc: number): string {
    if (acc >= 97) return "text-correct";
    if (acc >= 88) return "text-accent";
    return "text-incorrect";
  }

  return (
    <div className="fade-in flex flex-col gap-8 w-full">
      {/* Primary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center bg-surface border border-border rounded-xl p-5 gap-1">
          <span className="text-subtle text-xs font-mono uppercase tracking-widest">accuracy</span>
          <span className={`text-4xl font-bold font-mono ${getAccuracyColor(accuracy)}`}>
            {accuracy}%
          </span>
          <span className="text-subtle text-xs font-mono">{getAccuracyLabel(accuracy)}</span>
        </div>
        <div className="flex flex-col items-center bg-surface border border-border rounded-xl p-5 gap-1">
          <span className="text-subtle text-xs font-mono uppercase tracking-widest">wpm</span>
          <span className="text-4xl font-bold font-mono text-accent">{wpm}</span>
          <span className="text-subtle text-xs font-mono">no timer</span>
        </div>
        <div className="flex flex-col items-center bg-surface border border-border rounded-xl p-5 gap-1">
          <span className="text-subtle text-xs font-mono uppercase tracking-widest">time</span>
          <span className="text-4xl font-bold font-mono text-text">
            {formatElapsed(Math.round(elapsedSeconds))}
          </span>
          <span className="text-subtle text-xs font-mono">
            {report.totalErrors} error{report.totalErrors !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Error report */}
      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted uppercase tracking-widest">error report</span>
          <span className="font-mono text-xs text-subtle">
            {uniqueErrorPositions} of {text.length} chars affected
          </span>
        </div>

        {report.totalErrors > 0 ? (
          <>
            {/* Error type breakdown */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ErrorStat label="transpositions" value={report.transpositions} />
              <ErrorStat label="start of word" value={report.startOfWord} />
              <ErrorStat label="end of word" value={report.endOfWord} />
              <ErrorStat label="substitutions" value={report.substitutions} />
            </div>

            {/* Most missed characters */}
            {report.topMissedChars.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs text-subtle uppercase tracking-widest">
                  most missed
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.topMissedChars.map(([char, count]) => (
                    <div
                      key={char}
                      className="flex items-center gap-1.5 bg-bg border border-border rounded-lg px-3 py-1.5"
                    >
                      <span className="font-mono text-sm font-semibold text-incorrect">
                        {char === " " ? "space" : char}
                      </span>
                      <span className="font-mono text-xs text-subtle">×{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Observations */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs text-subtle uppercase tracking-widest">
                observations
              </span>
              <ul className="flex flex-col gap-2">
                {report.observations.map((obs, i) => (
                  <li key={i} className="font-mono text-sm text-text/80 flex gap-2">
                    <span className="text-accent flex-shrink-0">·</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="font-mono text-sm text-correct">
            {report.observations[0]}
          </p>
        )}
      </div>

      {/* Quote attribution */}
      <div className="bg-surface border border-border rounded-xl p-5 text-center">
        <p className="text-text/70 text-sm font-mono italic mb-2">
          &ldquo;{text.slice(0, 120)}{text.length > 120 ? "…" : ""}&rdquo;
        </p>
        <p className="text-subtle text-xs font-mono">— {quote.author}</p>
        <a
          href={quote.affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-accent text-xs hover:underline font-mono"
        >
          {quote.source} →
        </a>
      </div>

      {/* Actions */}
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
        <p className="text-subtle text-xs font-mono">
          <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text">Tab</kbd>{" "}
          retry &nbsp;·&nbsp;{" "}
          <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text">Enter</kbd>{" "}
          next
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-subtle text-xs uppercase tracking-widest font-mono">{label}</span>
      <span className={`text-lg font-semibold font-mono ${accent ? "text-correct" : "text-text"}`}>
        {value}
      </span>
    </div>
  );
}

function ErrorStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-bg border border-border rounded-lg p-3 gap-0.5">
      <span className={`text-2xl font-bold font-mono ${value > 0 ? "text-incorrect" : "text-subtle"}`}>
        {value}
      </span>
      <span className="text-subtle text-xs font-mono text-center leading-tight">{label}</span>
    </div>
  );
}
