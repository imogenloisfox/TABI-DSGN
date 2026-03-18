"use client";

interface InitialStepProps {
  value: string;
  onChange: (text: string) => void;
}

export default function InitialStep({ value, onChange }: InitialStepProps) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">
        Engraving
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type here..."
        className="w-full border border-border bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/40 focus:border-foreground focus:outline-none transition-colors"
      />
    </div>
  );
}
