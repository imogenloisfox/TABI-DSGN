"use client";

import { UK_RING_SIZES, type UKRingSize } from "@/lib/customiser/types";
import VanishButton from "@/components/ui/VanishButton";
import {
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  ringSizeChipDefault,
  ringSizeChipSelected,
  ringSizeChipDefaultMobile,
  ringSizeChipSelectedMobile,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

interface RingSizeStepProps {
  selected: UKRingSize | null;
  onSelect: (size: UKRingSize) => void;
  showLabel?: boolean;
  mobileLayout?: boolean;
  mobile?: boolean;
  mobileRowWidthPx?: number;
}

export default function RingSizeStep({ selected, onSelect, showLabel = true, mobileLayout = false, mobile = false, mobileRowWidthPx }: RingSizeStepProps) {
  const perRow    = mobileRowWidthPx ? Math.floor(mobileRowWidthPx / 30) : UK_RING_SIZES.length;
  const topRow    = mobileLayout ? UK_RING_SIZES.slice(0, UK_RING_SIZES.length - perRow) : [];
  const bottomRow = mobileLayout ? UK_RING_SIZES.slice(UK_RING_SIZES.length - perRow) : [];

  const chipButton = (size: typeof UK_RING_SIZES[number]) => {
    const isSelected = selected === size;
    return (
      <VanishButton
        key={size}
        onClick={() => onSelect(size)}
        className={`${
          isSelected
            ? (mobile ? ringSizeChipSelectedMobile : ringSizeChipSelected)
            : (mobile ? ringSizeChipDefaultMobile : ringSizeChipDefault)
        } !normal-case !h-[30px] !w-[30px] shrink-0 !px-0`}
        style={{ ...CHROME_HEADER_FONT, color: "#2a2c2d", backgroundColor: isSelected ? "#d9d9d9" : "#ffffff", ["--btn-bg" as string]: isSelected ? "#d9d9d9" : "#ffffff", ["--btn-color" as string]: "#2a2c2d" }}
        data-active={isSelected ? "true" : undefined}
      >
        {size}
      </VanishButton>
    );
  };

  return (
    <div className="py-0">
      {showLabel && (
        <p className={stepLabelClassForCategory("ring")} style={CHROME_LABEL_FONT}>
          Ring size
        </p>
      )}
      {mobileLayout ? (
        <div className="flex flex-col gap-0" style={{ width: mobileRowWidthPx ?? "calc(100vw - 16px)" }}>
          <div className="flex gap-0">{topRow.map(chipButton)}</div>
          <div className="flex gap-0">{bottomRow.map(chipButton)}</div>
        </div>
      ) : (
        <div className="flex max-w-[240px] flex-wrap gap-x-0 gap-y-0">
          {UK_RING_SIZES.map(chipButton)}
        </div>
      )}
    </div>
  );
}
