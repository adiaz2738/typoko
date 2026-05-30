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
  flawlessMode: boolean;
  initialQuote?: Quote;
}

type CharState = "pending" | "correct" | "incorrect" | "current";

interface CharData {
  char: string;
  state: CharState;
}

// Approximate line height for text-xl + leading-relaxed (20px * 1.625 = 32.5px)
const LINE_HEIGHT_PX = 33;
const VISIBLE_LINES = 3;
const VISIBLE_HEIGHT_PX = LINE_HEIGHT_PX * VISIBLE_LINES; // 99px
const CONTAINER_HEIGHT_PX = VISIBLE_HEIGHT_PX + 48; // + p-6 top + bottom padding

// Preload the next passage when this many chars remain in the current one (~25 words).
// This ensures the content is already rendered before the typist reaches the boundary.
const PRELOAD_CHARS_THRESHOLD = 150;

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
  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
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

// For quotes > 500 words: 70% chance to start at a random sentence boundary.
// Quotes <= 500 words always start from the beginning.
function getTextWithRandomStart(text: string): string {
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount <= 500 || Math.random() > 0.7) return text;

  const positions: number[] = [];
  const re = /[.!?]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const pos = m.index + m[0].length;
    if (pos < text.length - 100) positions.push(pos);
  }

  if (positions.length === 0) return text;
  return text.slice(positions[Math.floor(Math.random() * positions.length)]);
}

export default function TypingTest({ textMode, timerMode, flawlessMode, initialQuote }: TypingTestProps) {
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
  const [scrollY, setScrollY] = useState(0);
  const [flawlessFailed, setFlawlessFailed] = useState(false);
  const [flawlessCharsCompleted, setFlawlessCharsCompleted] = useState(0);

  const initialQuoteRef = useRef<Quote | undefined>(initialQuote);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const totalRef = useRef(0);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scrollYRef = useRef(0);
  const currentQuoteRef = useRef<Quote | null>(null);
  const currentTextRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const finishedElapsedRef = useRef<number>(0);
  // Tracks total planned content length (grows as passages are preloaded).
  // Used to trigger preloading at the right time regardless of stale closure state.
  const plannedEndRef = useRef(0);

  const countdown = timerMode !== null;
  const isTimedMode = timerMode !== null;

  const loadText = useCallback((keepCurrent = false) => {
    let text: string;
    let quote: Quote | null = null;

    if (keepCurrent && currentTextRef.current) {
      text = currentTextRef.current;
      quote = currentQuoteRef.current;
    } else if (textMode === "quotes") {
      if (initialQuoteRef.current) {
        quote = initialQuoteRef.current;
        text = quote.text;
      } else {
        quote = getRandomQuote();
        text = getTextWithRandomStart(quote.text);
      }
    } else {
      const wordCount = timerMode !== null
        ? Math.max(60, Math.ceil((timerMode / 60) * 120))
        : 60;
      text = generateWordSet(wordCount);
    }

    plannedEndRef.current = text.length;
    currentQuoteRef.current = quote;
    currentTextRef.current = text;
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
    setFlawlessFailed(false);
    setFlawlessCharsCompleted(0);
    scrollYRef.current = 0;
    setScrollY(0);
    elapsedRef.current = 0;
    correctRef.current = 0;
    incorrectRef.current = 0;
    totalRef.current = 0;
    finishedElapsedRef.current = 0;

    if (timerRef.current) clearInterval(timerRef.current);
  }, [textMode, timerMode]);

  useEffect(() => {
    loadText();
  }, [loadText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chars]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      setLiveWpm(calcWpm(correctRef.current, elapsedRef.current));

      if (isTimedMode && timerMode !== null && elapsedRef.current >= timerMode) {
        clearInterval(timerRef.current!);
        finishedElapsedRef.current = timerMode;
        setFinished(true);
      }
    }, 1000);
  }, [isTimedMode, timerMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        loadText(false);
        return;
      }

      if (finished) return;

      if (!started) {
        setStarted(true);
        startTimer();
      }

      if (e.key === "Backspace") {
        if (currentIndex === 0) return;
        const prevIdx = currentIndex - 1;
        const prevChar = chars[prevIdx];

        // Mutate refs outside the updater — React Strict Mode calls updaters twice,
        // which would double-decrement if mutations were inside.
        if (prevChar.state === "correct" || prevChar.state === "incorrect") {
          totalRef.current = Math.max(0, totalRef.current - 1);
        }
        if (prevChar.state === "correct") {
          correctRef.current = Math.max(0, correctRef.current - 1);
        }

        setChars((prev) => {
          const next = [...prev];
          next[currentIndex] = { ...next[currentIndex], state: "pending" };
          next[prevIdx] = { char: next[prevIdx].char, state: "current" };
          return next;
        });

        setCurrentIndex(prevIdx);
        setTotalTyped(totalRef.current);
        setCorrectChars(correctRef.current);
        setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));
        return;
      }

      if (e.key.length !== 1) return;

      const expected = chars[currentIndex]?.char;
      if (expected === undefined) return;
      const isCorrect = e.key === expected;

      totalRef.current += 1;
      if (isCorrect) correctRef.current += 1;
      else incorrectRef.current += 1;

      // Flawless mode: end immediately on first mistake
      if (flawlessMode && !isCorrect) {
        setChars((prev) => {
          const next = [...prev];
          next[currentIndex] = { char: expected, state: "incorrect" };
          return next;
        });
        setTotalTyped(totalRef.current);
        setCorrectChars(correctRef.current);
        setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));
        if (timerRef.current) clearInterval(timerRef.current);
        finishedElapsedRef.current = startTimeRef.current > 0
          ? (performance.now() - startTimeRef.current) / 1000
          : elapsedRef.current;
        setFlawlessFailed(true);
        setFlawlessCharsCompleted(currentIndex);
        setFinished(true);
        return;
      }

      const nextIdx = currentIndex + 1;
      const isChaining = timerMode === null || timerMode === 300;

      // Preload the next passage when within PRELOAD_CHARS_THRESHOLD chars of plannedEndRef.
      // plannedEndRef tracks total content length (including all prior preloads) synchronously,
      // so it stays accurate even though chars.length is stale inside this closure.
      // After appending, plannedEndRef jumps forward by the new passage length, suppressing
      // further preloads until the typist approaches the new end.
      let preloadChars: CharData[] = [];

      if (isChaining && plannedEndRef.current - currentIndex <= PRELOAD_CHARS_THRESHOLD) {
        let chainText = " "; // single space separates passages naturally
        let chainQuote: Quote | null = null;

        if (textMode === "quotes") {
          chainQuote = getRandomQuote();
          chainText += getTextWithRandomStart(chainQuote.text);
        } else {
          const wc = timerMode !== null ? Math.max(60, Math.ceil((timerMode / 60) * 120)) : 60;
          chainText += generateWordSet(wc);
        }

        preloadChars = chainText.split("").map(char => ({
          char,
          state: "pending" as CharState,
        }));
        plannedEndRef.current += chainText.length;
        if (chainQuote) currentQuoteRef.current = chainQuote;
      }

      setChars((prev) => {
        const next = [...prev];
        next[currentIndex] = { char: expected, state: isCorrect ? "correct" : "incorrect" };

        if (preloadChars.length > 0) {
          // Append new content and mark the next position as current.
          // nextIdx may equal prev.length (stale-isFinished edge case) — combined handles it.
          const combined = [...next, ...preloadChars];
          combined[nextIdx] = { ...combined[nextIdx], state: "current" };
          return combined;
        }

        // Use prev.length (actual current state) not stale chars.length to detect end correctly.
        // This handles the case where a prior preload already extended the array.
        if (nextIdx < prev.length) {
          next[nextIdx] = { ...next[nextIdx], state: "current" };
        }
        return next;
      });

      setTotalTyped(totalRef.current);
      setCorrectChars(correctRef.current);
      setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));

      // In chaining modes the timer drives the finish; cursor just keeps advancing.
      // In non-chaining modes, end when the passage is exhausted.
      const isFinished = nextIdx >= chars.length; // stale but only used for non-chaining finish
      if (!isChaining && isFinished && preloadChars.length === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishedElapsedRef.current = startTimeRef.current > 0
          ? (performance.now() - startTimeRef.current) / 1000
          : elapsedRef.current;
        setCurrentIndex(nextIdx);
        setFinished(true);
      } else {
        setCurrentIndex(nextIdx);
      }
    },
    [currentIndex, finished, started, startTimer, loadText, chars, flawlessMode, textMode, timerMode]
  );

  // Page through text in VISIBLE_HEIGHT_PX chunks as the current char advances
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

  const incorrectCount = incorrectRef.current;
  const timerLabel = formatTimer(elapsed, countdown, timerMode);
  const timerIsLow = countdown && timerMode !== null && timerMode - elapsed <= 10;

  if (finished) {
    const finalElapsed = Math.max(1, finishedElapsedRef.current || elapsed);
    return (
      <ResultsScreen
        wpm={calcWpm(correctChars, finalElapsed)}
        accuracy={calcAccuracy(correctChars, correctChars + incorrectRef.current)}
        elapsedSeconds={elapsed}
        correctChars={correctChars}
        incorrectChars={incorrectCount}
        quote={currentQuote}
        onRetry={() => loadText(true)}
        onNext={() => loadText(false)}
        flawlessFailed={flawlessFailed}
        charsBeforeFail={flawlessCharsCompleted}
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
          {flawlessMode && (
            <span className="text-incorrect text-xs font-mono font-semibold uppercase tracking-widest">
              flawless
            </span>
          )}
        </div>
        <div
          className={`text-2xl font-bold font-mono transition-colors ${
            timerIsLow ? "text-incorrect" : "text-accent"
          }`}
        >
          {!started && !countdown ? "—" : timerLabel}
        </div>
      </div>

      {/* Typing area — fixed height, clips overflow, inner div slides up */}
      <div
        className="relative bg-surface border border-border rounded-2xl px-6 pt-6 pb-6 cursor-text overflow-hidden"
        style={{ height: `${CONTAINER_HEIGHT_PX}px` }}
        onClick={() => inputRef.current?.focus()}
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
                {c.char}
              </span>
            );
          })}
        </div>

        {/* Hidden input captures all keystrokes */}
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          aria-label="Typing input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value=""
          onChange={() => {}}
        />
      </div>

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
