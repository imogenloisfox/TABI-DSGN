"use client";

import type { FinishType, ProductCategory } from "@/lib/customiser/types";
import VanishButton from "@/components/ui/VanishButton";
import {
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  SIDEBAR_BUTTON_ROW_2,
  earringMetalFinishPillDefault,
  earringMetalFinishPillSelected,
  pendantMetalFinishPillDefault,
  pendantMetalFinishPillSelected,
  ringMetalFinishPillDefault,
  ringMetalFinishPillSelected,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

interface FinishStepProps {
  category: ProductCategory | null;
  selected: FinishType | null;
  onSelect: (finish: FinishType) => void;
  showLabel?: boolean;
  /** When true, buttons use fixed 80px width instead of filling a grid row. */
  fixedWidth?: boolean;
}

const OPTIONS: { id: FinishType; label: string }[] = [
  { id: "shiny", label: "shiny" },
  { id: "matte", label: "matte" },
];

function pillClass(category: ProductCategory | null, isSelected: boolean): string {
  switch (category) {
    case "ring":
      return isSelected ? ringMetalFinishPillSelected : ringMetalFinishPillDefault;
    case "earrings":
      return isSelected ? earringMetalFinishPillSelected : earringMetalFinishPillDefault;
    default: // pendant + null fallback
      return isSelected ? pendantMetalFinishPillSelected : pendantMetalFinishPillDefault;
  }
}

export default function FinishStep({
  category,
  selected,
  onSelect,
  showLabel = true,
  fixedWidth = false,
}: FinishStepProps) {
  return (
    <div className="py-0">
      {showLabel && (
        <p className={stepLabelClassForCategory(category)} style={CHROME_LABEL_FONT}>
          metal
        </p>
      )}
      <div className={fixedWidth ? "flex gap-0" : SIDEBAR_BUTTON_ROW_2}>
        {OPTIONS.map((opt) => (
          <VanishButton
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`${pillClass(category, selected === opt.id)} ${fixedWidth ? "shrink-0" : "min-w-0 w-full"}`}
            style={fixedWidth ? { ...CHROME_HEADER_FONT, width: 80 } : CHROME_HEADER_FONT}
          >
            {opt.label}
          </VanishButton>
        ))}
      </div>
    </div>
  );
}
