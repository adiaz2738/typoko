"use client";

import Link from "next/link";
import UserButton from "./UserButton";

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <button
        onClick={onLogoClick}
        className="text-2xl font-bold text-accent font-mono tracking-tight hover:opacity-75 transition-opacity"
      >
        typoko
      </button>
      <nav className="flex items-center gap-8 text-sm text-subtle">
        <Link
          href="/daily"
          className="font-mono text-xs text-muted hover:text-subtle transition-colors"
        >
          daily
        </Link>
        <Link
          href="/library"
          className="font-mono text-xs text-muted hover:text-subtle transition-colors"
        >
          browse
        </Link>
        <Link
          href="/focus"
          className="font-mono text-xs text-muted hover:text-subtle transition-colors"
        >
          focus
        </Link>
        <span className="text-subtle/60 font-mono text-xs">read. type. learn.</span>
        <UserButton />
      </nav>
    </header>
  );
}
