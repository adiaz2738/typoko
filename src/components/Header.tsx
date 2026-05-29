"use client";

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <button
          onClick={onLogoClick}
          className="text-2xl font-bold text-accent font-mono tracking-tight hover:opacity-75 transition-opacity"
        >
          typoko
        </button>
      </div>
      <nav className="flex items-center gap-6 text-sm text-subtle">
        <span className="text-subtle/60 font-mono text-xs">
          type. challenge. learn.
        </span>
      </nav>
    </header>
  );
}
