# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

No test suite is configured.

## Architecture

Single-page Next.js 14 (App Router) typing speed test. The entire app lives on one route (`src/app/page.tsx`).

**State flow:** `page.tsx` owns `textMode` and `timerMode` and passes them down. A `key={textMode-timerMode}` prop on `<TypingTest>` forces a full remount whenever either mode changes — this is intentional and avoids reset logic inside the component.

**Core component — `TypingTest`:** Renders each character as a `<CharData>` object with state `pending | correct | incorrect | current`. Keystrokes are captured via a hidden `<input>` (opacity-0, overlaid on the display area) with `onKeyDown`. The visible text is read-only spans; the input never shows its value. Tab always resets. Timer starts on first keypress.

**Data sources:**

- `src/data/quotes.ts` — 50 `Quote` objects (`{ id, text, author, source, affiliateLink }`). `affiliateLink` is an Amazon affiliate URL with tag `typoko-20` — preserve these when adding quotes.
- `src/data/words.ts` — `commonWords[]` pool; `generateWordSet(n)` picks `n` random words and joins them with spaces.

**Modes:**

- Text: `"quotes"` (full quote string) or `"words"` (40 random words)
- Timer: `30 | 60 | 90 | 300 | null` — `null` means untimed (stopwatch). Countdown reaches zero → auto-finish.

**ResultsScreen** is shown in-place of `TypingTest` when `finished === true`. Both "retry" and "next →" call the same `loadText()` callback.

## Styling

Tailwind with a custom dark theme defined in `tailwind.config.ts`. Semantic color tokens: `bg`, `surface`, `border`, `muted`, `text`, `subtle`, `accent` (#e2b714 yellow), `correct` (green), `incorrect` (red), `current` (white). Always use these tokens rather than raw colors. Font stack is JetBrains Mono for all monospace elements, loaded via Google Fonts in `globals.css`.

Two global CSS utilities: `.cursor-blink` (blinking caret animation) and `.fade-in` (entry animation used on ResultsScreen).

## Deployment

`vercel.json` is present; the project is deployed to Vercel.

## Project Vision

Typoko is a minimal, fast typing speed website. The goal is to be cleaner and better than existing sites like Monkeytype and TypeRacer. Target audience is people who want a distraction-free typing experience and want to track their progress over time.

## Design Preferences

- Minimal, clean, distraction-free UI
- Current color scheme is fine for now (dark background, amber/yellow accent)
- Font may change later, leave as is for now
- Mobile responsive is required

## Known Issues to Fix

- Text display must be multi-line (3-5 visible lines), not single horizontal scrolling line
- Text should smoothly transition to next set of lines, never interrupt typing flow
- Typoko logo must be clickable and return to home screen / reset the test
- Enter key on results screen = load next quote
- Tab key on results screen = retry same quote
- Retry and Next buttons must be different: Retry = same quote, Next = new quote
- Tab during test = restart with new quote (keep this)
- Quotes need to be much longer (aim for 150-300 words each, enough to fill 30-90 seconds)

## Revenue

- Amazon affiliate links on quote sources (placeholder links exist, real ones added later)
- Minimal tasteful ads planned (not implemented yet)

## Roadmap

### Phase 1 (Current - Launch)

- Core typing test with quotes and words modes
- Timed modes: 30s, 60s, 90s, 5min, untimed
- User accounts and login
- Personal stats dashboard (WPM history, accuracy, personal bests, progress graph)
- Amazon affiliate links on quote sources
- Minimal ads
- Mobile responsive

### Phase 2 (Retention)

- Real-time on-screen keyboard showing keypresses as you type
- Keyboard heatmap showing error keys after test
- Global leaderboards per mode
- More quote categories (movies, literature, speeches)
- User settings (font size, theme, sound effects)
- Streak tracking
- Social sharing of results
- Hard/Technical mode: symbol and number-heavy content (equations, code snippets, financial data) as a separate optional mode

### Phase 3 (Competition)

- Multiplayer Classic mode
- Last Man Standing mode
- Friend challenge links
- Public profiles

### Phase 4 (Learning)

- Touch typing course
- Structured lessons by finger/hand
- Problem key drills based on heatmap data
- Progress tracking through lessons

### Phase 5 (Monetization)

- Premium accounts (ad-free, extra stats, custom themes)
- Mobile app if traffic justifies it

## Quotes Database Notes

- quotes.ts requires an id field for every entry — this is mandatory or it breaks the build
- Each quote needs: id (sequential number), text, author, source, affiliateLink
- Short quotes (under 100 words) should be avoided — they end too quickly for timed tests

## Pending Fixes

- WPM still feels slightly inflated but is lower priority than accuracy fix.
- Unlimited and 5min mode: when passage ends, seamlessly chain to a new random passage without interrupting typing flow.
- For quotes over 500 words, start at a random sentence/paragraph rather than always from the beginning. This adds variety for repeated sessions with the same long text.
- For quotes over 500 words, randomize the starting point: 70% chance of starting at a random sentence, 30% chance of starting from the beginning. The starting point must land at the beginning of a sentence (after a period). Short quotes under 300 words always start from the beginning.

