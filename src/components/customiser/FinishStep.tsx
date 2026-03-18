"use client";

import type { FinishType } from "@/lib/customiser/types";

interface FinishStepProps {
  selected: FinishType | null;
  onSelect: (finish: FinishType) => void;
}

const OPTIONS: { id: FinishType; label: string }[] = [
  { id: "shiny", label: "Shiny" },
  { id: "matte", label: "Matte" },
];

export default function FinishStep({ selected, onSelect }: FinishStepProps) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">
        Finish
      </p>
      <div className="flex gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex-1 cursor-pointer border px-2 py-1.5 text-[11px] font-medium transition-colors duration-100 ${
              selected === opt.id
                ? "border-foreground bg-foreground text-surface"
                : "border-border bg-transparent text-foreground hover:border-border-strong"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
