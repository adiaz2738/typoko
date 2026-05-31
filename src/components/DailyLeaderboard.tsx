"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DAILY_SCORE_SUBMITTED_EVENT,
  DailyScore,
  getNickname,
  getTopDailyScores,
} from "@/utils/dailyLeaderboard";

export default function DailyLeaderboard() {
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [nickname, setNicknameState] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setScores(getTopDailyScores(10));
    setNicknameState(getNickname());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(DAILY_SCORE_SUBMITTED_EVENT, refresh);
    return () => window.removeEventListener(DAILY_SCORE_SUBMITTED_EVENT, refresh);
  }, [refresh]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs text-muted tracking-widest">daily challenge</p>
        <h2 className="font-mono text-xl text-text font-bold">today&apos;s leaderboard</h2>
        <p className="font-mono text-xs text-subtle">top 10 · resets at midnight</p>
      </div>

      {scores.length === 0 ? (
        <p className="font-mono text-sm text-subtle py-4 text-center border border-border rounded-xl bg-surface">
          no scores yet — be the first
        </p>
      ) : (
        <div className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-2 border-b border-border font-mono text-xs text-muted uppercase tracking-widest">
            <span>#</span>
            <span>nickname</span>
            <span className="text-right">wpm</span>
            <span className="text-right">acc</span>
          </div>
          {scores.map((score, i) => {
            const isUser = nickname !== null && score.nickname === nickname;
            return (
              <div
                key={`${score.nickname}-${score.timestamp}`}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-2.5 font-mono text-sm border-b border-border last:border-b-0 ${
                  isUser ? "bg-accent/10 text-accent" : "text-text"
                }`}
              >
                <span className={isUser ? "text-accent" : "text-subtle"}>{i + 1}</span>
                <span className="truncate">{score.nickname}</span>
                <span className="text-right font-semibold">{score.wpm}</span>
                <span className={`text-right ${isUser ? "text-accent" : "text-subtle"}`}>
                  {score.accuracy}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
