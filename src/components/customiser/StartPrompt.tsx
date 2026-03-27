"use client";

interface StartPromptProps {
  onStart: () => void;
}

export default function StartPrompt({ onStart }: StartPromptProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-script text-5xl md:text-7xl text-foreground leading-none">
          TABI
        </h1>
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground font-mono">
          Engraving Customiser
        </p>
      </div>

      <p className="max-w-xs text-[10px] font-mono tracking-wide leading-relaxed text-foreground uppercase">
        Design your own personalised piece.
      </p>

      <button
        onClick={onStart}
        className="btn-primary cursor-pointer border border-foreground bg-surface px-6 py-2 text-[11px] font-medium tracking-wide text-foreground"
      >
        Open Customiser
      </button>
    </div>
  );
}
