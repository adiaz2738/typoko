"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

export default function UserButton() {
  const { user, username, loading, signOut, updateUsername } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setEditingUsername(false);
        setSaveError(null);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown((d) => !d);
          setEditingUsername(false);
          setSaveError(null);
        }}
        className="font-mono text-xs text-accent hover:opacity-75 transition-opacity"
      >
        {label}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-7 bg-surface border border-border rounded-lg py-1 z-50 min-w-44 shadow-lg">
          <p className="font-mono text-xs text-subtle px-3 py-1.5 truncate max-w-48">
            {user.email}
          </p>

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
              }}
              className="w-full text-left font-mono text-xs text-muted hover:text-text px-3 py-1.5 transition-colors"
            >
              change username
            </button>
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
