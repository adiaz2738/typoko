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

// Approximate line height for text-xl + leading-relaxed (20px * 1.625 = 32.5px)
const LINE_HEIGHT_PX = 33;
const VISIBLE_LINES = 3;
const VISIBLE_HEIGHT_PX = LINE_HEIGHT_PX * VISIBLE_LINES; // 99px
const CONTAINER_HEIGHT_PX = VISIBLE_HEIGHT_PX + 48; // + p-6 top + bottom padding

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
  const [scrollY, setScrollY] = useState(0);

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

  const countdown = timerMode !== null;
  const isTimedMode = timerMode !== null;

  const loadText = useCallback((keepCurrent = false) => {
    let text: string;
    let quote: Quote | null = null;

    if (keepCurrent && currentTextRef.current) {
      text = currentTextRef.current;
      quote = currentQuoteRef.current;
    } else if (textMode === "quotes") {
      quote = getRandomQuote();
      text = quote.text;
    } else {
      // Generate enough words to cover the full timer at 120 WPM (fast typist)
      const wordCount = timerMode !== null
        ? Math.max(60, Math.ceil((timerMode / 60) * 120))
        : 60;
      text = generateWordSet(wordCount);
    }

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

      const nextIdx = currentIndex + 1;
      const isFinished = nextIdx >= chars.length;

      setChars((prev) => {
        const next = [...prev];
        next[currentIndex] = { char: expected, state: isCorrect ? "correct" : "incorrect" };
        if (!isFinished) next[nextIdx] = { ...next[nextIdx], state: "current" };
        return next;
      });

      setTotalTyped(totalRef.current);
      setCorrectChars(correctRef.current);
      setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));

      if (isFinished) {
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
    [currentIndex, finished, started, startTimer, loadText, chars]
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
