"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  onClose: () => void;
}

type Tab = "login" | "signup";

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, [tab]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setSignupDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "login") {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        onClose();
      }
    } else {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSignupDone(true);
      }
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => switchTab("login")}
              className={`font-mono text-sm font-semibold transition-colors ${
                tab === "login" ? "text-accent" : "text-muted hover:text-subtle"
              }`}
            >
              login
            </button>
            <button
              onClick={() => switchTab("signup")}
              className={`font-mono text-sm font-semibold transition-colors ${
                tab === "signup" ? "text-accent" : "text-muted hover:text-subtle"
              }`}
            >
              sign up
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-subtle transition-colors font-mono text-lg leading-none"
            aria-label="close"
          >
            ×
          </button>
        </div>

        {signupDone ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="font-mono text-sm text-correct">account created.</p>
            <p className="font-mono text-xs text-subtle">
              check your email to confirm your address, then log in.
            </p>
            <button
              onClick={() => switchTab("login")}
              className="font-mono text-xs text-accent hover:underline text-left"
            >
              go to login →
            </button>
          </div>
        ) : (
          <>
            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete="email"
                autoCapitalize="off"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                minLength={6}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />

              {error && (
                <p className="font-mono text-xs text-incorrect">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : tab === "login" ? "login" : "create account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="font-mono text-xs text-subtle">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-bg border border-border rounded-lg font-mono text-sm text-text hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              continue with google
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
