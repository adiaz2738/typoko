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
  resultsNote?: string;
  dailyMode?: boolean;
}

type CharState = "pending" | "correct" | "incorrect" | "current";

interface CharData {
  char: string;
  state: CharState;
}

const LINE_HEIGHT_PX = 33;
const VISIBLE_LINES = 3;
const VISIBLE_HEIGHT_PX = LINE_HEIGHT_PX * VISIBLE_LINES;
const CONTAINER_HEIGHT_PX = VISIBLE_HEIGHT_PX + 48;
const PRELOAD_CHARS_THRESHOLD = 1000;
// On touch devices the stale closure can lag the real index; use a smaller target
// so even with 100–200 chars of closure lag the preload fires within the last ~50 words.
const PRELOAD_CHARS_THRESHOLD_TOUCH = 250;

// Virtualization: only render a window of characters around the current position
// instead of the full passage (which can be 10,000+ chars for long quotes).
// RENDER_WINDOW_CHARS is the size of the rendered slice; the window is recentered
// (in whole-page increments, see the scroll effect) once the current page advances
// past RENDER_WINDOW_RECENTER_PAGE, keeping RENDER_WINDOW_KEEP_PAGES of buffer above.
const RENDER_WINDOW_CHARS = 1200;
const RENDER_WINDOW_KEEP_PAGES = 1;
const RENDER_WINDOW_RECENTER_PAGE = 3;
// If the user backspaces before the rendered window's start, jump the window
// back to include the current position with this many chars of buffer.
const RENDER_WINDOW_BACK_BUFFER_CHARS = 400;

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

function getTextWithRandomStart(text: string): string {
  if (Math.random() > 0.7) return text;
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

export default function TypingTest({ textMode, timerMode, flawlessMode, initialQuote, resultsNote, dailyMode }: TypingTestProps) {
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
  const [windowStart, setWindowStart] = useState(0);
  const [flawlessFailed, setFlawlessFailed] = useState(false);
  const [flawlessCharsCompleted, setFlawlessCharsCompleted] = useState(0);

  const initialQuoteRef = useRef<Quote | undefined>(initialQuote);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingContainerRef = useRef<HTMLDivElement>(null);
  // Updated synchronously on every keystroke so the preload threshold check
  // never reads a stale value from the closure (critical on slow mobile renders).
  const currentIndexRef = useRef(0);
  // Detected once at mount; drives threshold selection in processTypedChar.
  const isTouchRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const totalRef = useRef(0);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scrollYRef = useRef(0);
  const currentQuoteRef = useRef<Quote | null>(null);
  const lastQuoteIdRef = useRef<number | null>(null);
  const currentTextRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const finishedElapsedRef = useRef<number>(0);
  const plannedEndRef = useRef(0);
  const isPreloadingRef = useRef(false);

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
        quote = getRandomQuote(lastQuoteIdRef.current ?? undefined);
        lastQuoteIdRef.current = quote.id;
        text = getTextWithRandomStart(quote.text);
      }
    } else {
      const wordCount = timerMode !== null
        ? Math.max(60, Math.ceil((timerMode / 60) * 120))
        : 60;
      text = generateWordSet(wordCount);
    }

    plannedEndRef.current = text.length;
    currentIndexRef.current = 0;
    isPreloadingRef.current = false;
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
    setWindowStart(0);
    elapsedRef.current = 0;
    correctRef.current = 0;
    incorrectRef.current = 0;
    totalRef.current = 0;
    finishedElapsedRef.current = 0;

    if (inputRef.current) inputRef.current.value = "";
    if (timerRef.current) clearInterval(timerRef.current);
  }, [textMode, timerMode]);

  useEffect(() => {
    loadText();
  }, [loadText]);

  // Detect touch capability once at mount
  useEffect(() => {
    isTouchRef.current = navigator.maxTouchPoints > 0;
  }, []);

  // Focus whenever chars change (covers initial load and retry/next resets)
  useEffect(() => {
    inputRef.current?.focus();
  }, [chars]);

  // On touch devices, scroll the typing area above the virtual keyboard when typing starts
  useEffect(() => {
    if (!started) return;
    const isTouchDevice = typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;
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
      setLiveWpm(calcWpm(correctRef.current, elapsedRef.current));

      if (isTimedMode && timerMode !== null && elapsedRef.current >= timerMode) {
        clearInterval(timerRef.current!);
        finishedElapsedRef.current = timerMode;
        setFinished(true);
      }
    }, 1000);
  }, [isTimedMode, timerMode]);

  // Core char processing, shared between handleKeyDown (desktop) and handleInput (mobile).
  // Uses functional updater so React schedules the array copy lazily instead of blocking
  // the event handler synchronously — this is the original approach that keeps input snappy.
  const processTypedChar = useCallback((key: string) => {
    if (finished) return;

    const expected = chars[currentIndex]?.char;
    if (expected === undefined) return;
    const isCorrect = key === expected;

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

    // Preload the next passage when within threshold chars of the planned end.
    // Use currentIndexRef (updated synchronously) so the check is never stale —
    // on mobile, renders lag behind keystrokes and the closure currentIndex can be
    // far behind the real position, causing preload to fire too late.
    const preloadThreshold = isTouchRef.current
      ? PRELOAD_CHARS_THRESHOLD_TOUCH
      : PRELOAD_CHARS_THRESHOLD;
    let preloadChars: CharData[] = [];
    if (!isPreloadingRef.current && isChaining && plannedEndRef.current - currentIndexRef.current <= preloadThreshold) {
      isPreloadingRef.current = true;
      let chainText = " ";
      let chainQuote: Quote | null = null;
      if (textMode === "quotes") {
        chainQuote = getRandomQuote(lastQuoteIdRef.current ?? undefined);
        lastQuoteIdRef.current = chainQuote.id;
        chainText += getTextWithRandomStart(chainQuote.text);
      } else {
        const wc = timerMode !== null ? Math.max(60, Math.ceil((timerMode / 60) * 120)) : 60;
        chainText += generateWordSet(wc);
      }
      preloadChars = chainText.split("").map(char => ({ char, state: "pending" as CharState }));
      plannedEndRef.current += chainText.length;
      if (chainQuote) currentQuoteRef.current = chainQuote;
      isPreloadingRef.current = false;
    }

    setChars((prev) => {
      const next = [...prev];
      next[currentIndex] = { char: expected, state: isCorrect ? "correct" : "incorrect" };

      if (preloadChars.length > 0) {
        const combined = [...next, ...preloadChars];
        combined[nextIdx] = { ...combined[nextIdx], state: "current" };
        return combined;
      }

      if (nextIdx < prev.length) {
        next[nextIdx] = { ...next[nextIdx], state: "current" };
      }
      return next;
    });

    setTotalTyped(totalRef.current);
    setCorrectChars(correctRef.current);
    setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));

    const isFinished = nextIdx >= chars.length; // stale, but only used for non-chaining finish
    currentIndexRef.current = nextIdx;
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
  }, [currentIndex, finished, chars, flawlessMode, textMode, timerMode]);

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

        currentIndexRef.current = prevIdx;
        setCurrentIndex(prevIdx);
        setTotalTyped(totalRef.current);
        setCorrectChars(correctRef.current);
        setLiveAccuracy(calcAccuracy(correctRef.current, correctRef.current + incorrectRef.current));
        return;
      }

      if (e.key.length === 1) {
        // Prevent the char from being inserted into the input DOM value.
        // When the input event then fires it sees value="" and exits early,
        // so the same keystroke isn't processed twice on iOS/desktop.
        e.preventDefault();
        processTypedChar(e.key);
      }
    },
    [currentIndex, finished, started, startTimer, loadText, chars, processTypedChar]
  );

  // Mobile fallback: Android virtual keyboards fire keydown with key="Unidentified"
  // and deliver the actual character via the input event instead.
  // On desktop/iOS, e.preventDefault() in handleKeyDown leaves input.value empty,
  // so value will be "" here and we exit immediately — no double-processing.
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    input.value = "";
    if (!value) return;

    if (!started) {
      setStarted(true);
      startTimer();
    }

    for (const char of value) {
      if (char !== "\n" && char !== "\r") {
        processTypedChar(char);
      }
    }
  }, [started, startTimer, processTypedChar]);

  // Page through text in VISIBLE_HEIGHT_PX chunks as the current char advances.
  // Also keeps the virtualized render window (windowStart) centered around the
  // current position — recentering happens in whole-page increments so the
  // translateY adjustment exactly cancels out the shift in rendered content,
  // making it visually seamless.
  useEffect(() => {
    // Backspaced before the rendered window — jump the window back so the
    // current char is rendered again. scrollY will be recalculated once the
    // window updates and this effect re-runs.
    if (currentIndex < windowStart) {
      setWindowStart(Math.max(0, currentIndex - RENDER_WINDOW_BACK_BUFFER_CHARS));
      return;
    }

    const charEl = charRefs.current[currentIndex];
    if (!charEl) return;
    const charTop = charEl.offsetTop;
    const page = Math.floor(charTop / VISIBLE_HEIGHT_PX);

    if (page >= RENDER_WINDOW_RECENTER_PAGE) {
      const targetTopPx = (page - RENDER_WINDOW_KEEP_PAGES) * VISIBLE_HEIGHT_PX;
      let newWindowStart = windowStart;
      for (let idx = windowStart; idx <= currentIndex; idx++) {
        const el = charRefs.current[idx];
        if (el && el.offsetTop >= targetTopPx) {
          newWindowStart = idx;
          break;
        }
      }
      const newScrollY = RENDER_WINDOW_KEEP_PAGES * VISIBLE_HEIGHT_PX;
      if (newWindowStart !== windowStart) setWindowStart(newWindowStart);
      if (newScrollY !== scrollYRef.current) {
        scrollYRef.current = newScrollY;
        setScrollY(newScrollY);
      }
      return;
    }

    const newScrollY = page * VISIBLE_HEIGHT_PX;
    if (newScrollY !== scrollYRef.current) {
      scrollYRef.current = newScrollY;
      setScrollY(newScrollY);
    }
  }, [currentIndex, windowStart]);

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
        note={resultsNote}
        dailyMode={dailyMode}
        mode={textMode}
        timer={timerMode}
      />
    );
  }

  return (
    <div ref={typingContainerRef} className="w-full max-w-3xl mx-auto px-4 pb-6 flex flex-col gap-6">
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
        onTouchStart={() => inputRef.current?.focus()}
      >
        <div
          className="relative font-mono text-xl leading-relaxed tracking-wide select-none"
          style={{
            transform: `translateY(-${scrollY}px)`,
            transition: scrollY === 0 ? "none" : "transform 180ms ease",
          }}
        >
          {chars.slice(windowStart, windowStart + RENDER_WINDOW_CHARS).map((c, localI) => {
            const i = windowStart + localI;
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

        {/* Hidden input — captures keystrokes on desktop and virtual keyboard on touch devices.
            onTouchStart on the input itself guarantees focus comes from the element's own
            touch event, which Android requires to reliably open the virtual keyboard. */}
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          enterKeyHint="send"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onTouchStart={() => inputRef.current?.focus()}
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          aria-label="Typing input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
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
