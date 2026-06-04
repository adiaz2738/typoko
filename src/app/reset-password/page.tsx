"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("passwords do not match");
      return;
    }
    if (!supabase) {
      setError("service not configured");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted tracking-widest">account</p>
            <h1 className="font-mono text-xl text-text font-bold">reset password</h1>
            <p className="font-mono text-xs text-subtle">enter your new password below.</p>
          </div>

          {done ? (
            <div className="flex flex-col gap-2 py-1">
              <p className="font-mono text-sm text-correct">password updated.</p>
              <p className="font-mono text-xs text-subtle">redirecting you home…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="new password"
                required
                minLength={6}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete="new-password"
                autoFocus
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="confirm password"
                required
                minLength={6}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete="new-password"
              />

              {error && (
                <p className="font-mono text-xs text-incorrect">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "update password"}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
