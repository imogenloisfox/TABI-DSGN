"use client";

import type { ProductType } from "@/lib/customiser/types";

interface ProductSelectorProps {
  selected: ProductType | null;
  onSelect: (product: ProductType) => void;
}

const OPTIONS: { id: ProductType; label: string }[] = [
  { id: "ring", label: "Ring" },
  { id: "pendant", label: "Pendant" },
];

export default function ProductSelector({ selected, onSelect }: ProductSelectorProps) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">
        Piece
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
