"use client";

import type { GemstoneId } from "@/lib/customiser/types";
import { GEMSTONES } from "@/data/gemstones";

interface GemstoneStepProps {
  selected: GemstoneId | null;
  onSelect: (id: GemstoneId) => void;
}

export default function GemstoneStep({ selected, onSelect }: GemstoneStepProps) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">
        Stone
      </p>
      <div className="flex flex-wrap gap-1.5">
        {GEMSTONES.map((gem) => {
          const isActive = selected === gem.id;
          return (
            <button
              key={gem.id}
              onClick={() => onSelect(gem.id)}
              title={gem.label}
              className={`group flex cursor-pointer items-center justify-center border p-1.5 transition-colors duration-100 ${
                isActive
                  ? "border-foreground"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <div
                className="h-4 w-3"
                style={{
                  backgroundColor: gem.hex,
                  clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
                }}
              />
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-1.5 text-[10px] text-muted">
          {GEMSTONES.find((g) => g.id === selected)?.label}
        </p>
      )}
    </div>
  );
}
