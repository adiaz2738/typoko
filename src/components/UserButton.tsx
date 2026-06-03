"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

export default function UserButton() {
  const { user, loading, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

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

  const label = user.email ? user.email.split("@")[0] : "account";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((d) => !d)}
        className="font-mono text-xs text-accent hover:opacity-75 transition-opacity"
      >
        {label}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-7 bg-surface border border-border rounded-lg py-1 z-50 min-w-36 shadow-lg">
          <p className="font-mono text-xs text-subtle px-3 py-1.5 truncate max-w-48">
            {user.email}
          </p>
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
