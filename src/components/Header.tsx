"use client";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-accent font-mono tracking-tight">
          typoko
        </span>
      </div>
      <nav className="flex items-center gap-6 text-sm text-subtle">
        <span className="text-subtle/60 font-mono text-xs">
          type. improve. repeat.
        </span>
      </nav>
    </header>
  );
}
