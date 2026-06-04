"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getTodayDateKey, DAILY_SCORE_SUBMITTED_EVENT } from "@/utils/dailyLeaderboard";

interface LeaderboardRow {
  user_id: string;
  wpm: number;
  accuracy: number;
}

export default function DailyLeaderboard() {
  const { user, username } = useAuth();
  const [scores, setScores] = useState<LeaderboardRow[]>([]);
  const [usernameMap, setUsernameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    // 1. Fetch today's top 10 scores
    const { data: scoreData, error: scoreError } = await supabase
      .from("daily_scores")
      .select("user_id, wpm, accuracy")
      .eq("date", getTodayDateKey())
      .order("wpm", { ascending: false })
      .limit(10);

    if (scoreError) {
      console.error("[leaderboard] scores:", scoreError.message);
      setLoading(false);
      return;
    }

    const rows = scoreData ?? [];

    // 2. Fetch usernames from profiles for every user_id in those scores
    const map: Record<string, string> = {};
    if (rows.length > 0) {
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      if (profileError) {
        console.error("[leaderboard] profiles:", profileError.message, profileError.hint);
      }

      for (const p of profileData ?? []) {
        if (p.id && p.username) map[p.id] = p.username;
      }
    }

    setScores(rows);
    setUsernameMap(map);
    setLoading(false);
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

      {loading ? (
        <p className="font-mono text-sm text-subtle py-4 text-center border border-border rounded-xl bg-surface">
          loading…
        </p>
      ) : scores.length === 0 ? (
        <p className="font-mono text-sm text-subtle py-4 text-center border border-border rounded-xl bg-surface">
          no scores yet — be the first
        </p>
      ) : (
        <div className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-2 border-b border-border font-mono text-xs text-muted uppercase tracking-widest">
            <span>#</span>
            <span>player</span>
            <span className="text-right">wpm</span>
            <span className="text-right">acc</span>
          </div>
          {scores.map((score, i) => {
            const isUser = !!user && user.id === score.user_id;
            // Username from profiles map for all rows; current user falls back to
            // auth context username then email prefix; others fall back to "player"
            const displayName =
              usernameMap[score.user_id] ??
              (isUser
                ? (username ?? user.email?.split("@")[0] ?? "you")
                : "player");
            return (
              <div
                key={score.user_id}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-2.5 font-mono text-sm border-b border-border last:border-b-0 ${
                  isUser ? "bg-accent/10 text-accent" : "text-text"
                }`}
              >
                <span className={isUser ? "text-accent" : "text-subtle"}>{i + 1}</span>
                <span className="truncate">{displayName}</span>
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
