"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "./AuthModal";

export default function UserButton() {
  const { user, username, loading, signOut, updateUsername } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetView, setResetView] = useState<"idle" | "sent">("idle");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setEditingUsername(false);
        setSaveError(null);
        setResetView("idle");
        setResetError(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  useEffect(() => {
    if (editingUsername) inputRef.current?.focus();
  }, [editingUsername]);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="font-mono text-xs text-muted hover:text-subtle transition-colors"
        >
          login
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  const label = username ?? user.email?.split("@")[0] ?? "account";

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const { error } = await updateUsername(usernameInput);
    if (error) {
      setSaveError(error);
    } else {
      setEditingUsername(false);
      setShowDropdown(false);
    }
    setSaving(false);
  }

  async function handleResetPassword() {
    if (!supabase || !user?.email) return;
    setResetLoading(true);
    setResetError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: "https://typoko.com/reset-password",
    });
    if (err) {
      setResetError(err.message);
    } else {
      setResetView("sent");
    }
    setResetLoading(false);
  }

  function openResetPassword() {
    setEditingUsername(false);
    setSaveError(null);
    setResetView("idle");
    setResetError(null);
    handleResetPassword();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown((d) => !d);
          setEditingUsername(false);
          setSaveError(null);
          setResetView("idle");
          setResetError(null);
        }}
        className="font-mono text-xs text-accent hover:opacity-75 transition-opacity"
      >
        {label}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-7 bg-surface border border-border rounded-lg py-1 z-50 min-w-44 shadow-lg">
          <Link
            href="/profile"
            onClick={() => setShowDropdown(false)}
            className="block w-full text-left font-mono text-xs text-muted hover:text-text px-3 py-1.5 transition-colors"
          >
            profile
          </Link>

          <div className="border-t border-border my-1" />

          {editingUsername ? (
            <form onSubmit={handleSaveUsername} className="px-3 py-1.5 flex flex-col gap-1.5">
              <input
                ref={inputRef}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                maxLength={20}
                placeholder="new username"
                className="w-full bg-bg border border-border rounded px-2 py-1 font-mono text-xs text-text placeholder:text-muted focus:outline-none focus:border-accent"
              />
              {saveError && (
                <p className="font-mono text-xs text-incorrect">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !usernameInput.trim()}
                  className="font-mono text-xs text-accent disabled:opacity-40"
                >
                  {saving ? "saving…" : "save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingUsername(false); setSaveError(null); }}
                  className="font-mono text-xs text-muted hover:text-subtle"
                >
                  cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setUsernameInput(username ?? "");
                setEditingUsername(true);
                setResetView("idle");
                setResetError(null);
              }}
              className="w-full text-left font-mono text-xs text-muted hover:text-text px-3 py-1.5 transition-colors"
            >
              change username
            </button>
          )}

          {resetView === "sent" ? (
            <div className="px-3 py-1.5 flex flex-col gap-1">
              <p className="font-mono text-xs text-correct">check your email for a reset link.</p>
            </div>
          ) : (
            <button
              onClick={openResetPassword}
              disabled={resetLoading}
              className="w-full text-left font-mono text-xs text-muted hover:text-text px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {resetLoading ? "sending…" : "reset password"}
            </button>
          )}

          {resetError && (
            <p className="font-mono text-xs text-incorrect px-3 pb-1">{resetError}</p>
          )}

          <div className="border-t border-border my-1" />

          <button
            onClick={async () => {
              setShowDropdown(false);
              await signOut();
            }}
            className="w-full text-left font-mono text-xs text-muted hover:text-text px-3 py-1.5 transition-colors"
          >
            sign out
          </button>
        </div>
      )}
    </div>
  );
}
