"use client";

export type TextMode = "quotes" | "words";
export type TimerMode = 30 | 60 | 90 | 300 | null;

interface ModeSelectorProps {
  textMode: TextMode;
  timerMode: TimerMode;
  onTextModeChange: (mode: TextMode) => void;
  onTimerModeChange: (mode: TimerMode) => void;
}

const timerOptions: { label: string; value: TimerMode }[] = [
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "5m", value: 300 },
  { label: "∞", value: null },
];

export default function ModeSelector({
  textMode,
  timerMode,
  onTextModeChange,
  onTimerModeChange,
}: ModeSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
      {/* Text mode */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border">
        <button
          onClick={() => onTextModeChange("quotes")}
          className={`px-4 py-1.5 rounded-md text-sm font-mono transition-all duration-150 ${
            textMode === "quotes"
              ? "bg-accent text-bg font-semibold"
              : "text-subtle hover:text-text"
          }`}
        >
          quotes
        </button>
        <button
          onClick={() => onTextModeChange("words")}
          className={`px-4 py-1.5 rounded-md text-sm font-mono transition-all duration-150 ${
            textMode === "words"
              ? "bg-accent text-bg font-semibold"
              : "text-subtle hover:text-text"
          }`}
        >
          words
        </button>
      </div>

      {/* Timer mode */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border">
        {timerOptions.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => onTimerModeChange(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-150 ${
              timerMode === value
                ? "bg-accent text-bg font-semibold"
                : "text-subtle hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
