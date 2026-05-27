"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ModeSelector, { TextMode, TimerMode } from "@/components/ModeSelector";
import TypingTest from "@/components/TypingTest";

export default function Home() {
  const [textMode, setTextMode] = useState<TextMode>("quotes");
  const [timerMode, setTimerMode] = useState<TimerMode>(60);
  const [resetKey, setResetKey] = useState(0);

  const testKey = `${textMode}-${timerMode}-${resetKey}`;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header onLogoClick={() => setResetKey((k) => k + 1)} />

      <main className="flex-1 flex flex-col items-center justify-center gap-10 px-4 py-12">
        <ModeSelector
          textMode={textMode}
          timerMode={timerMode}
          onTextModeChange={setTextMode}
          onTimerModeChange={setTimerMode}
        />

        <TypingTest key={testKey} textMode={textMode} timerMode={timerMode} />
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; made for fast fingers
      </footer>
    </div>
  );
}
