"use client";

import type { FinishType, ProductCategory } from "@/lib/customiser/types";
import VanishButton from "@/components/ui/VanishButton";
import {
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  SIDEBAR_BUTTON_ROW_2,
  earringMetalFinishPillDefault,
  earringMetalFinishPillSelected,
  earringMetalFinishPillDefaultMobile,
  earringMetalFinishPillSelectedMobile,
  pendantMetalFinishPillDefault,
  pendantMetalFinishPillSelected,
  pendantMetalFinishPillDefaultMobile,
  pendantMetalFinishPillSelectedMobile,
  ringMetalFinishPillDefault,
  ringMetalFinishPillSelected,
  ringMetalFinishPillDefaultMobile,
  ringMetalFinishPillSelectedMobile,
  mobileBtnHoverSurfaceModifier,
  mobileBtnStyle,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

interface FinishStepProps {
  category: ProductCategory | null;
  selected: FinishType | null;
  onSelect: (finish: FinishType) => void;
  showLabel?: boolean;
  /** When true, buttons use fixed 80px width instead of filling a grid row. */
  fixedWidth?: boolean;
  /** When true, use mobile class variants (no hover/active colour changes). */
  mobile?: boolean;
}

const OPTIONS: { id: FinishType; label: string }[] = [
  { id: "shiny", label: "shiny" },
  { id: "matte", label: "matte" },
];

function pillClass(category: ProductCategory | null, isSelected: boolean, mobile: boolean): string {
  switch (category) {
    case "ring":
      return mobile
        ? (isSelected ? ringMetalFinishPillSelectedMobile : ringMetalFinishPillDefaultMobile)
        : (isSelected ? ringMetalFinishPillSelected : ringMetalFinishPillDefault);
    case "earrings":
      return mobile
        ? (isSelected ? earringMetalFinishPillSelectedMobile : earringMetalFinishPillDefaultMobile)
        : (isSelected ? earringMetalFinishPillSelected : earringMetalFinishPillDefault);
    default:
      return mobile
        ? (isSelected ? pendantMetalFinishPillSelectedMobile : pendantMetalFinishPillDefaultMobile)
        : (isSelected ? pendantMetalFinishPillSelected : pendantMetalFinishPillDefault);
  }
}

export default function FinishStep({
  category,
  selected,
  onSelect,
  showLabel = true,
  fixedWidth = false,
  mobile = false,
}: FinishStepProps) {
  return (
    <div className="py-0">
      {showLabel && (
        <p className={stepLabelClassForCategory(category)} style={CHROME_LABEL_FONT}>
          metal
        </p>
      )}
      <div className={fixedWidth ? "flex gap-0" : SIDEBAR_BUTTON_ROW_2}>
        {OPTIONS.map((opt, idx) => {
          const mobileFinishBg = idx === 0 ? "#d9d9d9" : "#b1b1b1";
          const desktopFinishBg = idx === 0 ? "#b1b1b1" : "#8d8d8d";
          const finishBg = mobile ? mobileFinishBg : desktopFinishBg;
          return (
            <VanishButton
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`${pillClass(category, selected === opt.id, mobile)} ${fixedWidth ? "shrink-0" : "min-w-0 w-full"}${mobileBtnHoverSurfaceModifier(finishBg)}`}
              style={mobile ? { ...CHROME_HEADER_FONT, width: fixedWidth ? 80 : undefined, ...mobileBtnStyle(mobileFinishBg, "#2a2c2d") } : { ...CHROME_HEADER_FONT, ...(fixedWidth ? { width: 80 } : {}), backgroundColor: finishBg }}
              data-active={selected === opt.id ? "true" : undefined}
            >
              {opt.label}
            </VanishButton>
          );
        })}
      </div>
    </div>
  );
}
