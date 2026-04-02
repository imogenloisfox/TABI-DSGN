"use client";

import { UK_RING_SIZES, type UKRingSize } from "@/lib/customiser/types";
import VanishButton from "@/components/ui/VanishButton";
import {
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  ringSizeChipDefault,
  ringSizeChipSelected,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

interface RingSizeStepProps {
  selected: UKRingSize | null;
  onSelect: (size: UKRingSize) => void;
  showLabel?: boolean;
  /** Mobile: fixed 60px buttons in a 2-row grid instead of 30px chips. */
  mobileLayout?: boolean;
}

export default function RingSizeStep({ selected, onSelect, showLabel = true, mobileLayout = false }: RingSizeStepProps) {
  // Mobile: 2-row layout capped at 320px. Bottom row is completely full;
  // remaining sizes overflow into the top row.
  const maxWidth = 320;
  const perRow   = Math.floor(maxWidth / 30); // 10
  const topRow    = mobileLayout ? UK_RING_SIZES.slice(0, UK_RING_SIZES.length - perRow) : [];
  const bottomRow = mobileLayout ? UK_RING_SIZES.slice(UK_RING_SIZES.length - perRow) : [];

  const chipButton = (size: typeof UK_RING_SIZES[number]) => (
    <VanishButton
      key={size}
      onClick={() => onSelect(size)}
      className={`${
        selected === size ? ringSizeChipSelected : ringSizeChipDefault
      } !normal-case !h-[30px] !w-[30px] shrink-0 !px-0`}
      style={CHROME_HEADER_FONT}
    >
      {size}
    </VanishButton>
  );

  return (
    <div className="py-0">
      {showLabel && (
        <p className={stepLabelClassForCategory("ring")} style={CHROME_LABEL_FONT}>
          Ring size
        </p>
      )}
      {mobileLayout ? (
        <div className="flex max-w-[320px] flex-col gap-0 overflow-hidden">
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
