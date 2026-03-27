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
    <div className="bg-background px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-foreground uppercase">
        Metal Finish
      </p>
      <div className="flex gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`btn-primary flex-1 cursor-pointer border border-foreground px-2 py-1.5 text-[10px] font-mono ${
              selected === opt.id
                ? "bg-foreground text-surface"
                : "bg-surface text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
