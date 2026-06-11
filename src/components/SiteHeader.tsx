"use client";

import { useState } from "react";
import Link from "next/link";
import UserButton from "./UserButton";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link
        href="/"
        className="text-2xl font-bold text-accent font-mono tracking-tight hover:opacity-75 transition-opacity"
      >
        typoko
      </Link>

      {/* Desktop nav - unchanged */}
      <nav className="hidden md:flex items-center gap-8">
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
        <Link
          href="/blog"
          className="font-mono text-xs text-muted hover:text-subtle transition-colors"
        >
          blog
        </Link>
        <span className="text-subtle/60 font-mono text-xs">read. type. learn.</span>
        <UserButton />
      </nav>

      {/* Mobile: slogan + hamburger */}
      <div className="flex md:hidden items-center gap-4">
        <span className="text-subtle/60 font-mono text-xs">read. type. learn.</span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="text-text hover:text-accent transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-accent z-50 md:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end px-4 py-4">
          <button
            onClick={closeMenu}
            aria-label="Close menu"
            className="text-bg hover:opacity-70 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col px-2">
          <div className="px-6 py-4 border-b border-bg/10">
            <UserButton variant="mobile" />
          </div>
          <Link
            href="/daily"
            onClick={closeMenu}
            className="font-mono text-lg text-bg px-6 py-4 border-b border-bg/10 hover:bg-bg/10 transition-colors"
          >
            daily
          </Link>
          <Link
            href="/library"
            onClick={closeMenu}
            className="font-mono text-lg text-bg px-6 py-4 border-b border-bg/10 hover:bg-bg/10 transition-colors"
          >
            browse
          </Link>
          <Link
            href="/focus"
            onClick={closeMenu}
            className="font-mono text-lg text-bg px-6 py-4 border-b border-bg/10 hover:bg-bg/10 transition-colors"
          >
            focus
          </Link>
          <Link
            href="/blog"
            onClick={closeMenu}
            className="font-mono text-lg text-bg px-6 py-4 border-b border-bg/10 hover:bg-bg/10 transition-colors"
          >
            blog
          </Link>
        </nav>
      </div>
    </header>
  );
}
