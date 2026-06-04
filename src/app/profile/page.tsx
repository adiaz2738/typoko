"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";

interface TypingResult {
  id: string;
  wpm: number;
  accuracy: number;
  mode: string;
  timer: number | null;
  created_at: string;
}

interface ProfileData {
  username: string;
  created_at: string;
}

interface Stats {
  total: number;
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  avgWpmQuotes: number | null;
  avgWpmWords: number | null;
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toLowerCase();
}

function formatShortDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toLowerCase();
}

function timerLabel(timer: number | null): string {
  if (timer === null) return "untimed";
  if (timer === 300) return "5min";
  return `${timer}s`;
}

function computeStats(results: TypingResult[]): Stats {
  if (results.length === 0) {
    return { total: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0, avgWpmQuotes: null, avgWpmWords: null };
  }
  const total = results.length;
  const avgWpm = Math.round(results.reduce((s, r) => s + r.wpm, 0) / total);
  const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / total);
  const bestWpm = Math.max(...results.map((r) => r.wpm));
  const quotes = results.filter((r) => r.mode === "quotes");
  const words = results.filter((r) => r.mode === "words");
  const avgWpmQuotes = quotes.length > 0 ? Math.round(quotes.reduce((s, r) => s + r.wpm, 0) / quotes.length) : null;
  const avgWpmWords = words.length > 0 ? Math.round(words.reduce((s, r) => s + r.wpm, 0) / words.length) : null;
  return { total, avgWpm, avgAccuracy, bestWpm, avgWpmQuotes, avgWpmWords };
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateUsername } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [results, setResults] = useState<TypingResult[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    setFetching(true);

    Promise.all([
      supabase.from("profiles").select("username, created_at").eq("id", user.id).single(),
      supabase
        .from("typing_results")
        .select("id, wpm, accuracy, mode, timer, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([profileRes, resultsRes]) => {
      if (profileRes.data) {
        setProfile(profileRes.data);
        setUsernameInput(profileRes.data.username);
      }
      if (resultsRes.data) setResults(resultsRes.data);
      setFetching(false);
    });
  }, [user]);

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const { error } = await updateUsername(usernameInput);
    if (error) {
      setSaveError(error);
    } else {
      setSaveSuccess(true);
      setProfile((p) => p ? { ...p, username: usernameInput.trim().slice(0, 20) } : p);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setSaving(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-subtle">loading…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="font-mono text-xs text-muted tracking-widest uppercase">profile</p>
            <h1 className="font-mono text-xl text-text font-bold">sign in to view your stats</h1>
            <p className="font-mono text-sm text-subtle">track your WPM, accuracy, and progress over time.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            sign in
          </button>
          {showModal && <AuthModal onClose={() => setShowModal(false)} />}
        </main>
      </div>
    );
  }

  const stats = computeStats(results);
  const last10 = results.slice(0, 10);
  const memberSince = profile?.created_at ? formatDate(profile.created_at) : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* Username header */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs text-muted tracking-widest uppercase">profile</p>
            <form onSubmit={handleSaveUsername} className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={usernameInput}
                onChange={(e) => { setUsernameInput(e.target.value); setSaveSuccess(false); setSaveError(null); }}
                maxLength={20}
                placeholder="username"
                className="bg-transparent border-b border-border font-mono text-2xl font-bold text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors w-64"
              />
              <button
                type="submit"
                disabled={saving || !usernameInput.trim()}
                className="font-mono text-xs text-muted hover:text-accent disabled:opacity-40 transition-colors"
              >
                {saving ? "saving…" : saveSuccess ? "saved ✓" : "save"}
              </button>
            </form>
            {saveError && (
              <p className="font-mono text-xs text-incorrect">{saveError}</p>
            )}
            {memberSince && (
              <p className="font-mono text-xs text-subtle">member since {memberSince}</p>
            )}
          </div>

          {fetching ? (
            <p className="font-mono text-sm text-subtle">loading stats…</p>
          ) : stats.total === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="font-mono text-sm text-subtle">no tests completed yet.</p>
              <p className="font-mono text-xs text-muted mt-1">finish a test to see your stats here.</p>
            </div>
          ) : (
            <>
              {/* Main stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="tests" value={stats.total.toString()} />
                <StatCard label="avg wpm" value={stats.avgWpm.toString()} highlight />
                <StatCard label="avg accuracy" value={`${stats.avgAccuracy}%`} />
                <StatCard label="best wpm" value={stats.bestWpm.toString()} />
              </div>

              {/* Mode breakdown */}
              {(stats.avgWpmQuotes !== null || stats.avgWpmWords !== null) && (
                <div className="flex flex-col gap-3">
                  <p className="font-mono text-xs text-muted tracking-widest uppercase">avg wpm by mode</p>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.avgWpmQuotes !== null && (
                      <StatCard label="quotes" value={stats.avgWpmQuotes.toString()} />
                    )}
                    {stats.avgWpmWords !== null && (
                      <StatCard label="words" value={stats.avgWpmWords.toString()} />
                    )}
                  </div>
                </div>
              )}

              {/* Recent tests */}
              <div className="flex flex-col gap-3">
                <p className="font-mono text-xs text-muted tracking-widest uppercase">recent tests</p>
                <div className="border border-border rounded-xl bg-surface overflow-hidden">
                  <div className="grid grid-cols-[1fr_5rem_4rem_4rem] gap-2 px-4 py-2 border-b border-border font-mono text-xs text-muted uppercase tracking-widest">
                    <span>date</span>
                    <span>mode</span>
                    <span className="text-right">wpm</span>
                    <span className="text-right">acc</span>
                  </div>
                  {last10.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[1fr_5rem_4rem_4rem] gap-2 px-4 py-2.5 font-mono text-sm border-b border-border last:border-b-0 text-text"
                    >
                      <span className="text-subtle text-xs">{formatShortDate(r.created_at)}</span>
                      <span className="text-xs">{r.mode} · {timerLabel(r.timer)}</span>
                      <span className="text-right font-semibold text-accent">{r.wpm}</span>
                      <span className="text-right text-subtle">{r.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center bg-surface border border-border rounded-xl p-5 gap-1">
      <span className="text-subtle text-xs font-mono uppercase tracking-widest">{label}</span>
      <span className={`text-3xl font-bold font-mono ${highlight ? "text-accent" : "text-text"}`}>
        {value}
      </span>
    </div>
  );
}
