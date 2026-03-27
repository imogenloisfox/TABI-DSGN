"use client";

import { UK_RING_SIZES, type UKRingSize } from "@/lib/customiser/types";

interface RingSizeStepProps {
  selected: UKRingSize | null;
  onSelect: (size: UKRingSize) => void;
}

export default function RingSizeStep({ selected, onSelect }: RingSizeStepProps) {
  return (
    <div className="bg-background px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-foreground uppercase">
        Ring Size <span className="normal-case">(UK)</span>
      </p>
      <div className="flex flex-wrap gap-1 bg-background">
        {UK_RING_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`btn-primary h-7 w-7 cursor-pointer border border-foreground text-[10px] font-mono font-medium ${
              selected === size
                ? "bg-foreground text-surface"
                : "bg-surface text-foreground"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      {selected && (
        <p className="mt-1.5 text-[9px] font-mono tracking-wide text-foreground uppercase">
          Selected: {selected}
          {selected === "M" ? " (default)" : ""}
        </p>
      )}
    </div>
  );
}
