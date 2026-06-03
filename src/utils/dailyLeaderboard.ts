export interface DailyScore {
  nickname: string;
  wpm: number;
  accuracy: number;
  timestamp: number;
}

const NICKNAME_KEY = "typoko_nickname";
export const MAX_NICKNAME_LENGTH = 20;

export function getTodayDateKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyStorageKey(): string {
  return `typoko_daily_${getTodayDateKey()}`;
}

export function getNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname.trim().slice(0, MAX_NICKNAME_LENGTH));
}

export function getDailyScores(): DailyScore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getDailyStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getBestScoreForNickname(nickname: string): DailyScore | null {
  const trimmed = nickname.trim().slice(0, MAX_NICKNAME_LENGTH);
  const scores = getDailyScores();
  const existing = scores.filter((s) => s.nickname === trimmed);
  if (existing.length === 0) return null;
  return existing.reduce((best, s) => (s.wpm > best.wpm ? s : best));
}

export function submitDailyScore(wpm: number, accuracy: number, nickname: string): void {
  const trimmed = nickname.trim().slice(0, MAX_NICKNAME_LENGTH);
  const scores = getDailyScores();
  const existingIndex = scores.findIndex((s) => s.nickname === trimmed);
  const newEntry: DailyScore = { nickname: trimmed, wpm, accuracy, timestamp: Date.now() };
  if (existingIndex === -1) {
    scores.push(newEntry);
  } else if (wpm > scores[existingIndex].wpm) {
    scores[existingIndex] = newEntry;
  }
  localStorage.setItem(getDailyStorageKey(), JSON.stringify(scores));
}

export function getTopDailyScores(limit = 10): DailyScore[] {
  return [...getDailyScores()]
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.timestamp - b.timestamp)
    .slice(0, limit);
}

export const DAILY_SCORE_SUBMITTED_EVENT = "typoko-daily-score-submitted";

export function notifyDailyScoreSubmitted(): void {
  window.dispatchEvent(new CustomEvent(DAILY_SCORE_SUBMITTED_EVENT));
}
