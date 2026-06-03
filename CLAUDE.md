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

Next.js 14 (App Router) typing speed test with multiple routes.

**Routes:**
- `src/app/page.tsx` — home page (core typing test)
- `src/app/daily/page.tsx` — Today's Passage daily challenge
- `src/app/library/page.tsx` — browse all passages with search
- `src/app/focus/page.tsx` — Focus Mode typing training
- `src/app/type/[author]/page.tsx` — author SEO pages
- `src/app/type/[author]/[passage]/page.tsx` — individual passage SEO pages

**State flow:** `page.tsx` owns `textMode` and `timerMode` and passes them down. A `key={textMode-timerMode}` prop on `<TypingTest>` forces a full remount whenever either mode changes — this is intentional and avoids reset logic inside the component.

**Core component — `TypingTest`:** Renders each character as a `<CharData>` object with state `pending | correct | incorrect | current`. Keystrokes are captured via a hidden `<input>` (opacity-0, overlaid on the display area) with `onKeyDown`. The visible text is read-only spans; the input never shows its value. Tab always resets. Timer starts on first keypress. Mobile Android uses `onInput` fallback since virtual keyboards fire `key="Unidentified"`.

**Passage chaining:** For untimed and 5min modes, the next passage is preloaded when within threshold chars of the end and appended to the char array. Desktop threshold is 1000 chars; touch devices use 250 chars due to stale closure lag on slow mobile renders. The transition is invisible to the typist.

**Key components:**
- `SiteHeader` — navigation header with browse/daily/focus links and auth user button
- `PassageTypingTest` — thin wrapper used by daily/author/passage pages; locks to a specific quote and 60s timer
- `ResultsScreen` — shown when `finished === true`; includes stats, share card, submit score button in daily mode
- `DailyLeaderboard` — fetches top 10 scores from Supabase `daily_scores` table for today; refreshes on `DAILY_SCORE_SUBMITTED_EVENT`
- `ModeSelector` — mode toggle buttons for text/timer modes on home page

**Data sources:**
- `src/data/quotes.ts` — `Quote` objects (`{ id, text, author, source, affiliateLink, authorSlug, passageSlug }`). `id` is mandatory (sequential integer). `affiliateLink` uses Amazon tag `ddevstore-20` — preserve when adding quotes. Short quotes (under 100 words) should be avoided.
- `src/data/words.ts` — `commonWords[]` pool; `generateWordSet(n)` picks `n` random words and joins them with spaces.

**Modes:**
- Text: `"quotes"` (full quote string) or `"words"` (40 random words)
- Timer: `30 | 60 | 90 | 300 | null` — `null` means untimed (stopwatch). Countdown reaches zero → auto-finish.

**Auth and database:**
- Supabase client at `src/lib/supabase.ts`
- Auth context at `src/context/AuthContext.tsx` — provides `{ user, loading }` via `useAuth()`
- Supabase auth supports email/password and Google OAuth
- Custom SMTP configured with support@typoko.com
- `daily_scores` table columns: `user_id`, `date` (ISO format `YYYY-MM-DD`), `wpm`, `accuracy`, `quote_id`
- Date keys from `getTodayDateKey()` in `src/utils/dailyLeaderboard.ts` return ISO format `YYYY-MM-DD`

**ResultsScreen** is shown in-place of `TypingTest` when `finished === true`. "Retry" reloads the same text; "Next →" loads new text. Enter = next, Tab = retry.

## Styling

Tailwind with a custom dark theme defined in `tailwind.config.ts`. Semantic color tokens: `bg`, `surface`, `border`, `muted`, `text`, `subtle`, `accent` (#e2b714 yellow), `correct` (green), `incorrect` (red), `current` (white). Always use these tokens rather than raw colors. Font stack is JetBrains Mono for all monospace elements, loaded via Google Fonts in `globals.css`.

Two global CSS utilities: `.cursor-blink` (blinking caret animation) and `.fade-in` (entry animation used on ResultsScreen).

## Deployment

`vercel.json` is present; deployed to Vercel. Vercel Analytics and Speed Insights are wired in.

## Project Vision

Typoko is a minimal, fast typing speed website. The goal is to be cleaner and better than existing sites like Monkeytype and TypeRacer. Target audience is people who want a distraction-free typing experience and want to track their progress over time.

## Design Preferences

- Minimal, clean, distraction-free UI
- Current color scheme is fine for now (dark background, amber/yellow accent)
- Font may change later, leave as is for now
- Mobile responsive is required

## Revenue

- Amazon affiliate links on quote sources (tag: ddevstore-20)
- Minimal tasteful ads planned (not implemented yet)

## Roadmap

### Phase 1 (Complete - Launched)

- Core typing test with quotes and words modes
- Timed modes: 30s, 60s, 90s, 5min, untimed
- Flawless mode
- Passage chaining for unlimited and 5min modes
- Randomized starting points for long passages
- Accurate WPM and accuracy tracking
- Amazon affiliate links on quote sources
- Mobile responsive
- Multi-line text display with smooth paging
- Tab to reset, Enter = next on results, Tab = retry on results
- Retry vs Next distinction (same quote vs new quote)

### Phase 2 (In Progress)

**Complete:**
- Supabase auth with email/password and Google OAuth
- Custom SMTP with support@typoko.com
- Auth modal and user button in header
- Today's Passage daily challenge page (`/daily`)
- Daily leaderboard (Supabase-backed, top 10, resets daily)
- Shareable results card with download/share button (html2canvas)
- Author and passage SEO pages (`/type/[author]`, `/type/[author]/[passage]`)
- Library page with search bar (`/library`)
- Header navigation (browse, daily, focus links)
- Focus Mode page with error tracking (`/focus`)
- Vercel Analytics and Speed Insights

**Remaining:**
- User profiles and usernames (display name instead of email prefix)
- Personal stats dashboard (WPM history, accuracy trends, personal bests, progress graph)
- Wiring daily leaderboard fully to real accounts (submit + score persistence working end-to-end)
- Personal bests tracking per mode
- Streak tracking (daily login / daily challenge streaks)
- Global leaderboards per mode
- User settings (font size, theme, sound effects)
- Real-time on-screen keyboard showing keypresses as you type
- Keyboard heatmap showing error keys after test
- Focus Mode stat tracking and targeted practice drills based on error patterns
- Blog content for SEO ("typing test with real books", "literary typing test", author-focused posts)
- Author bios on author pages
- User passage suggestion form
- Poem and screenplay formatting support (future)
- Flawless daily challenge variant (future)
- Focus Mode character-by-character option (future)

### Phase 3 (Competition)

- Multiplayer Classic mode
- Last Man Standing mode
- Friend challenge links
- Public profiles
- Compare pages for SEO (Typoko vs Monkeytype etc.)

### Phase 4 (Learning)

- Touch typing course
- Structured lessons by finger/hand
- Problem key drills based on heatmap data
- Progress tracking through lessons

### Phase 5 (Monetization)

- Premium accounts (ad-free, extra stats, custom themes)
- Hard/Technical mode with symbols, equations, and code snippets
- Mobile app if traffic justifies it

## Pending Fixes

- **Daily leaderboard submit button:** Insert was silently failing — `display_name` column does not exist in `daily_scores` table. Removed from insert. Date format also fixed to ISO `YYYY-MM-DD`. Error logging and visible error state added. Needs end-to-end verification that scores are persisting and appearing in leaderboard.
- **Mobile passage preload:** On touch devices, stale closure lag causes the preload threshold check to fire too late. Touch threshold lowered to 250 chars but still not reliable on all devices. May need a ref-based approach for the preload trigger.
- **Mobile scroll above keyboard:** When typing starts on touch devices, the typing area should scroll above the virtual keyboard. Implemented with `scrollIntoView` but inconsistent across browsers.
- **Samsung tablet keystroke registration:** Some Samsung tablet keyboards do not reliably trigger `onKeyDown` or `onInput`. Needs investigation into which event fires and whether `compositionend` is needed.
- **Chrome iOS lag:** Input handling lags noticeably on Chrome for iOS. May be related to how WKWebView handles hidden inputs. Needs profiling.

## Focus Mode

Dedicated typing training mode for users with dyslexia-like struggles (letter omissions, transpositions, wrong-key presses, reading-processing fog). Not about speed or keyboard memorization — targets sequencing, execution, inhibition, and accuracy. Page exists at `/focus`. Current implementation includes error tracking and per-session error pattern reporting. Future additions: post-session targeted drills, character-by-character mode, stat persistence to Supabase. Full context document saved separately — paste into chat when ready to extend.
