"use client";

import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";
import VanishButton from "@/components/ui/VanishButton";
import { preloadCategory } from "@/components/preview/scene/ProductModel";
import {
  CHROME_GREY,
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  SIDEBAR_BUTTON_ROW_3,
  SIDEBAR_BUTTON_ROW_4,
  customiserToolbarInvertInteraction,
  customiserToolbarSelectedInvert,
  pendantJewelleryVariantPillDefault,
  pendantJewelleryVariantPillSelected,
  ringJewelleryVariantPillDefault,
  ringJewelleryVariantPillSelected,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

/** Shared layout for jewellery row pills (category + variant). */
const JEWELLERY_PILL =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase";

function categoryPillClass(category: ProductCategory, isSelected: boolean): string {
  const inv = customiserToolbarInvertInteraction;
  if (isSelected) {
    return `${JEWELLERY_PILL} min-w-0 w-full max-w-full ${customiserToolbarSelectedInvert}`;
  }
  switch (category) {
    case "ring":
      return `${JEWELLERY_PILL} min-w-0 w-full max-w-full !bg-[#d9d9d9] text-[#2a2c2d] ${inv}`;
    case "pendant":
      return `${JEWELLERY_PILL} min-w-0 w-full max-w-full !bg-[#b1b1b1] text-[#2a2c2d] ${inv}`;
    case "earrings":
      return `${JEWELLERY_PILL} min-w-0 w-full max-w-full !bg-[#8d8d8d] text-[#2a2c2d] ${inv}`;
  }
}

function variantPillClass(
  category: Exclude<ProductCategory, "earrings">,
  isSelected: boolean,
): string {
  switch (category) {
    case "ring":
      return isSelected ? ringJewelleryVariantPillSelected : ringJewelleryVariantPillDefault;
    case "pendant":
      return isSelected
        ? pendantJewelleryVariantPillSelected
        : pendantJewelleryVariantPillDefault;
  }
}

interface ProductSelectorProps {
  selectedCategory: ProductCategory | null;
  selectedVariant:  ProductVariant | null;
  onSelect:         (category: ProductCategory, variant: ProductVariant) => void;
  showLabel?:       boolean;
  /** When true, variant row renders above category row (mobile bottom-panel layout). */
  reverseRows?:     boolean;
  /** When true, use fixed-width flex layout instead of grid (mobile panels). */
  mobileLayout?:    boolean;
}

interface VariantOption { id: ProductVariant; label: string; title?: string; }
interface CategoryOption { id: ProductCategory; label: string; variants: VariantOption[]; }

const CATEGORIES: CategoryOption[] = [
  {
    id: "ring",
    label: "ring",
    variants: [
      { id: "ringClassic", label: "moi" },
      { id: "ringConcave", label: "sui" },
      { id: "ringClassicNoGem", label: "meus" },
      { id: "ringConcaveNoGem", label: "ego", title: "ego — without centre stone" },
    ],
  },
  {
    id: "pendant",
    label: "pendant",
    variants: [
      { id: "pendantOne", label: "soi" },
      { id: "pendantTwo", label: "moment" },
      { id: "pendantMesmo", label: "mesmo" },
    ],
  },
  {
    id: "earrings",
    label: "earrings",
    variants: [],
  },
];

/** 1-4 chars → 60px, 5-8 → 80px, 9+ → 120px */
function mobilePillWidthPx(label: string): number {
  const len = label.length;
  if (len <= 4) return 60;
  if (len <= 8) return 80;
  return 120;
}

export default function ProductSelector({ selectedCategory, selectedVariant, onSelect, showLabel = true, reverseRows = false, mobileLayout = false }: ProductSelectorProps) {
  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory);

  const handleCategoryClick = (cat: CategoryOption) => {
    // Kick off deferred GLB preloads for this category so assets are warming
    // in the background before the model mounts.
    preloadCategory(cat.id);
    if (cat.variants.length === 0) {
      // Earrings — variant id matches category id
      onSelect(cat.id, cat.id as ProductVariant);
    } else {
      // Select first variant by default when switching category
      onSelect(cat.id, cat.variants[0].id);
    }
  };

  return (
    <div className="py-0">
      {showLabel && (
        <p
          className={stepLabelClassForCategory(selectedCategory)}
          style={{ ...CHROME_LABEL_FONT, color: CHROME_GREY }}
        >
          Jewellery
        </p>
      )}

      {/* Variant sub-options — rendered before categories when reverseRows is true */}
      {reverseRows && activeCategory && activeCategory.variants.length > 0 && (
        <div
          className={
            mobileLayout
              ? "flex flex-wrap gap-0"
              : activeCategory.id === "ring" ? SIDEBAR_BUTTON_ROW_4 : SIDEBAR_BUTTON_ROW_3
          }
        >
          {activeCategory.variants.map((v) => (
            <VanishButton
              key={v.id}
              title={v.title}
              onClick={() => onSelect(activeCategory.id, v.id)}
              className={`${variantPillClass(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id)}${mobileLayout ? " shrink-0" : ""}`}
              style={mobileLayout ? { ...CHROME_HEADER_FONT, width: mobilePillWidthPx(v.label), minWidth: 0 } : CHROME_HEADER_FONT}
            >
              {v.label}
            </VanishButton>
          ))}
        </div>
      )}

      {/* Category buttons */}
      <div className={mobileLayout ? "flex flex-wrap gap-0" : SIDEBAR_BUTTON_ROW_3}>
        {CATEGORIES.map((cat) => (
          <VanishButton
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`${categoryPillClass(cat.id, selectedCategory === cat.id)}${mobileLayout ? " shrink-0" : ""}`}
            style={mobileLayout ? { ...CHROME_HEADER_FONT, width: 80, minWidth: 0 } : CHROME_HEADER_FONT}
          >
            {cat.label}
          </VanishButton>
        ))}
      </div>

      {/* Variant sub-options — rendered after categories in default order */}
      {!reverseRows && activeCategory && activeCategory.variants.length > 0 && (
        <div
          className={
            mobileLayout
              ? "flex flex-wrap gap-0"
              : activeCategory.id === "ring" ? SIDEBAR_BUTTON_ROW_4 : SIDEBAR_BUTTON_ROW_3
          }
        >
          {activeCategory.variants.map((v) => (
            <VanishButton
              key={v.id}
              title={v.title}
              onClick={() => onSelect(activeCategory.id, v.id)}
              className={`${variantPillClass(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id)}${mobileLayout ? " shrink-0" : ""}`}
              style={mobileLayout ? { ...CHROME_HEADER_FONT, width: mobilePillWidthPx(v.label), minWidth: 0 } : CHROME_HEADER_FONT}
            >
              {v.label}
            </VanishButton>
          ))}
        </div>
      )}
    </div>
  );
}
