"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Quote, getRandomQuote } from "@/data/quotes";
import { generateWordSet } from "@/data/words";
import { TextMode, TimerMode } from "./ModeSelector";
import ResultsScreen from "./ResultsScreen";

interface TypingTestProps {
  textMode: TextMode;
  timerMode: TimerMode;
}

type CharState = "pending" | "correct" | "incorrect" | "current";

interface CharData {
  char: string;
  state: CharState;
}

function buildCharData(text: string): CharData[] {
  return text.split("").map((char, i) => ({
    char,
    state: i === 0 ? "current" : "pending",
  }));
}

function calcWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds === 0) return 0;
  return Math.round((correctChars / 5) / (elapsedSeconds / 60));
}

function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

function formatTimer(seconds: number, countdown: boolean, limit: number | null): string {
  const display = countdown && limit !== null ? Math.max(0, limit - seconds) : seconds;
  if (display >= 60) {
    const m = Math.floor(display / 60);
    const s = display % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return display.toString();
}

export default function TypingTest({ textMode, timerMode }: TypingTestProps) {
  const [chars, setChars] = useState<CharData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const countdown = timerMode !== null;
  const isTimedMode = timerMode !== null;

  const loadText = useCallback(() => {
    let text: string;
    let quote: Quote | null = null;

    if (textMode === "quotes") {
      quote = getRandomQuote();
      text = quote.text;
    } else {
      text = generateWordSet(40);
    }

    setCurrentQuote(quote);
    setChars(buildCharData(text));
    setCurrentIndex(0);
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setCorrectChars(0);
    setTotalTyped(0);
    setLiveWpm(0);
    setLiveAccuracy(100);
    elapsedRef.current = 0;
    correctRef.current = 0;
    totalRef.current = 0;

    if (timerRef.current) clearInterval(timerRef.current);
  }, [textMode]);

  useEffect(() => {
    loadText();
  }, [loadText]);

  // Focus input on mount and on click anywhere
  useEffect(() => {
    inputRef.current?.focus();
  }, [chars]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      setLiveWpm(calcWpm(correctRef.current, elapsedRef.current));

      // Timed mode: auto-finish when countdown hits 0
      if (isTimedMode && timerMode !== null && elapsedRef.current >= timerMode) {
        clearInterval(timerRef.current!);
        setFinished(true);
      }
    }, 1000);
  }, [isTimedMode, timerMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Tab to restart
      if (e.key === "Tab") {
        e.preventDefault();
        loadText();
        return;
      }

      if (finished) return;

      if (!started) {
        setStarted(true);
        startTimer();
      }

      setChars((prev) => {
        const next = [...prev];
        const idx = currentIndex;

        if (e.key === "Backspace") {
          if (idx === 0) return prev;
          const prevIdx = idx - 1;
          // Unmark the char we're backing over (clear current marker)
          next[idx] = { ...next[idx], state: "pending" };
          // Restore previous char to "current"
          next[prevIdx] = { char: next[prevIdx].char, state: "current" };
          setCurrentIndex(prevIdx);
          return next;
        }

        // Only handle printable single chars
        if (e.key.length !== 1) return prev;

        const expected = next[idx].char;
        const isCorrect = e.key === expected;

        next[idx] = { char: expected, state: isCorrect ? "correct" : "incorrect" };

        totalRef.current += 1;
        setTotalTyped((t) => t + 1);

        if (isCorrect) {
          correctRef.current += 1;
          setCorrectChars((c) => c + 1);
        }

        setLiveAccuracy(calcAccuracy(correctRef.current, totalRef.current));

        const nextIdx = idx + 1;

        if (nextIdx >= next.length) {
          // Finished all characters
          if (timerRef.current) clearInterval(timerRef.current);
          setFinished(true);
          return next;
        }

        next[nextIdx] = { ...next[nextIdx], state: "current" };
        setCurrentIndex(nextIdx);
        return next;
      });
    },
    [currentIndex, finished, started, startTimer, loadText]
  );

  // Scroll current char into view
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    charRefs.current[currentIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [currentIndex]);

  const incorrectCount = totalTyped - correctChars;
  const timerLabel = formatTimer(elapsed, countdown, timerMode);
  const timerIsLow = countdown && timerMode !== null && timerMode - elapsed <= 10;

  if (finished) {
    return (
      <ResultsScreen
        wpm={calcWpm(correctChars, elapsed)}
        accuracy={calcAccuracy(correctChars, totalTyped)}
        elapsedSeconds={elapsed}
        correctChars={correctChars}
        incorrectChars={incorrectCount}
        quote={currentQuote}
        onRetry={loadText}
        onNext={loadText}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between font-mono text-sm">
        <div className="flex items-center gap-6">
          <StatPill label="wpm" value={liveWpm.toString()} />
          <StatPill label="acc" value={`${liveAccuracy}%`} />
        </div>
        <div
          className={`text-2xl font-bold font-mono transition-colors ${
            timerIsLow ? "text-incorrect" : "text-accent"
          }`}
        >
          {!started && !countdown ? "—" : timerLabel}
        </div>
      </div>

      {/* Typing area */}
      <div
        ref={containerRef}
        className="relative bg-surface border border-border rounded-2xl p-6 cursor-text max-h-48 overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="font-mono text-xl leading-relaxed tracking-wide select-none">
          {chars.map((c, i) => {
            let color = "text-muted"; // pending
            if (c.state === "correct") color = "text-correct";
            else if (c.state === "incorrect") color = "text-incorrect";
            else if (c.state === "current") color = "text-current";

            const isCurrent = c.state === "current";

            return (
              <span
                key={i}
                ref={(el) => { charRefs.current[i] = el; }}
                className={`relative ${color}`}
              >
                {isCurrent && (
                  <span
                    className="absolute -left-px top-0 bottom-0 w-0.5 bg-accent cursor-blink rounded-full"
                    aria-hidden
                  />
                )}
                {c.char === " " ? " " : c.char}
              </span>
            );
          })}
        </div>

        {/* Hidden real input */}
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          aria-label="Typing input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={false}
          value=""
          onChange={() => {}}
        />
      </div>

      {/* Hint */}
      {!started && (
        <p className="text-center text-subtle text-xs font-mono fade-in">
          start typing to begin &nbsp;·&nbsp;{" "}
          <kbd className="bg-surface border border-border px-1.5 py-0.5 rounded text-text/70">
            Tab
          </kbd>{" "}
          to restart
        </p>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-subtle text-xs uppercase tracking-widest">{label}</span>
      <span className="text-text text-lg font-semibold">{value}</span>
    </div>
  );
}
