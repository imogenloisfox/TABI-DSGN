"use client";

import type React from "react";
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
  pendantJewelleryVariantPillDefaultMobile,
  pendantJewelleryVariantPillSelectedMobile,
  ringJewelleryVariantPillDefault,
  ringJewelleryVariantPillSelected,
  ringJewelleryVariantPillDefaultMobile,
  ringJewelleryVariantPillSelectedMobile,
  categoryPillClassMobile,
  categoryPillStyleMobile,
  mobileBtnStyle,
  mobileBtnHoverSurfaceModifier,
  MOBILE_BTN_COLOURS,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";

/** Shared layout for jewellery row pills (category + variant). */
const JEWELLERY_PILL =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase";

function categoryPillClass(_category: ProductCategory, isSelected: boolean): string {
  const inv = customiserToolbarInvertInteraction;
  return `${JEWELLERY_PILL} min-w-0 w-full max-w-full text-[#2a2c2d] ${isSelected ? customiserToolbarSelectedInvert : inv}`;
}

const DESKTOP_CATEGORY_BG: Record<ProductCategory, string> = {
  ring:     "#d9d9d9",
  pendant:  "#b1b1b1",
  earrings: "#8d8d8d",
};

const DESKTOP_RING_VARIANT_BG: Record<string, string> = {
  ringClassic:      "#d9d9d9",
  ringConcave:      "#b1b1b1",
  ringClassicNoGem: "#8d8d8d",
  ringConcaveNoGem: "#676767",
  pendantOne:   "#d9d9d9",
  pendantTwo:   "#b1b1b1",
  pendantMesmo: "#8d8d8d",
};

/** Mobile panel — variant pill fills (must stay in sync with `varPillStyle` map). */
const VARIANT_MOBILE_BG: Record<string, string> = {
  pendantOne:        "#ffffff",
  pendantTwo:        "#d9d9d9",
  pendantMesmo:      "#b1b1b1",
  ringClassic:       "#ffffff",
  ringConcave:       "#d9d9d9",
  ringClassicNoGem:  "#b1b1b1",
  ringConcaveNoGem:  "#8d8d8d",
};

function variantSurfaceBg(
  category: Exclude<ProductCategory, "earrings">,
  variantId: string,
  mobileLayout: boolean,
  mobile: boolean,
): string {
  if (mobileLayout && mobile) {
    return VARIANT_MOBILE_BG[variantId] ?? MOBILE_BTN_COLOURS[category].bg;
  }
  return DESKTOP_RING_VARIANT_BG[variantId] ?? "#d9d9d9";
}

function categorySurfaceBg(
  cat: ProductCategory,
  selectedCategory: ProductCategory | null,
  mobileLayout: boolean,
  mobile: boolean,
): string {
  if (mobileLayout && mobile) {
    const s = categoryPillStyleMobile(cat, selectedCategory === cat);
    return (s.backgroundColor as string) ?? DESKTOP_CATEGORY_BG[cat];
  }
  return DESKTOP_CATEGORY_BG[cat];
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

function desktopRingVariantStyle(variantId: string): React.CSSProperties | undefined {
  const bg = DESKTOP_RING_VARIANT_BG[variantId];
  return bg ? { backgroundColor: bg } : undefined;
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
  /** When true, render only the variant sub-options (no category buttons). */
  variantsOnly?:    boolean;
  /** When true, render only the category buttons (no variant sub-options). */
  categoriesOnly?:  boolean;
  /** When true, use mobile class variants (no hover/active colour changes). */
  mobile?:          boolean;
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

export default function ProductSelector({ selectedCategory, selectedVariant, onSelect, showLabel = true, reverseRows = false, mobileLayout = false, variantsOnly = false, categoriesOnly = false, mobile = false }: ProductSelectorProps) {
  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory);

  const catPillClass = (cat: ProductCategory, isSelected: boolean) =>
    mobile ? categoryPillClassMobile(cat, isSelected) : categoryPillClass(cat, isSelected);

  const catPillStyle = (cat: ProductCategory, isSelected: boolean) =>
    mobile ? categoryPillStyleMobile(cat, isSelected) : undefined;

  const varPillClass = (cat: Exclude<ProductCategory, "earrings">, isSelected: boolean) => {
    if (mobile) {
      if (cat === "ring") return isSelected ? ringJewelleryVariantPillSelectedMobile : ringJewelleryVariantPillDefaultMobile;
      return isSelected ? pendantJewelleryVariantPillSelectedMobile : pendantJewelleryVariantPillDefaultMobile;
    }
    return variantPillClass(cat, isSelected);
  };

  const varPillStyle = (cat: Exclude<ProductCategory, "earrings">, _isSelected: boolean, variantId?: string) => {
    if (!mobile) return undefined;
    const bg =
      variantId && VARIANT_MOBILE_BG[variantId] ? VARIANT_MOBILE_BG[variantId] : MOBILE_BTN_COLOURS[cat].bg;
    return mobileBtnStyle(bg, "#2a2c2d");
  };

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
      {reverseRows && !categoriesOnly && activeCategory && activeCategory.variants.length > 0 && (
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
              className={`${varPillClass(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id)}${mobileLayout ? " shrink-0" : ""}${mobileBtnHoverSurfaceModifier(
                variantSurfaceBg(activeCategory.id as Exclude<ProductCategory, "earrings">, v.id, mobileLayout, mobile),
              )}`}
              style={mobileLayout ? { ...CHROME_HEADER_FONT, width: mobilePillWidthPx(v.label), minWidth: 0, ...varPillStyle(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id, v.id) } : { ...CHROME_HEADER_FONT, ...desktopRingVariantStyle(v.id) }}
              data-active={selectedVariant === v.id ? "true" : undefined}
            >
              {v.label}
            </VanishButton>
          ))}
        </div>
      )}

      {/* Category buttons */}
      {!variantsOnly && (
        <div className={mobileLayout ? "flex flex-wrap gap-0" : SIDEBAR_BUTTON_ROW_3}>
          {CATEGORIES.map((cat) => (
            <VanishButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`${catPillClass(cat.id, selectedCategory === cat.id)}${mobileLayout ? " shrink-0" : ""}${mobileBtnHoverSurfaceModifier(
                categorySurfaceBg(cat.id, selectedCategory, mobileLayout, mobile),
              )}`}
              style={mobileLayout ? { ...CHROME_HEADER_FONT, width: 80, minWidth: 0, ...catPillStyle(cat.id, selectedCategory === cat.id) } : { ...CHROME_HEADER_FONT, backgroundColor: DESKTOP_CATEGORY_BG[cat.id] }}
              data-active={selectedCategory === cat.id ? "true" : undefined}
            >
              {cat.label}
            </VanishButton>
          ))}
        </div>
      )}

      {/* Variant sub-options — rendered after categories in default order, or always when variantsOnly */}
      {(!reverseRows || variantsOnly) && !categoriesOnly && activeCategory && activeCategory.variants.length > 0 && (
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
              className={`${varPillClass(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id)}${mobileLayout ? " shrink-0" : ""}${mobileBtnHoverSurfaceModifier(
                variantSurfaceBg(activeCategory.id as Exclude<ProductCategory, "earrings">, v.id, mobileLayout, mobile),
              )}`}
              style={mobileLayout ? { ...CHROME_HEADER_FONT, width: mobilePillWidthPx(v.label), minWidth: 0, ...varPillStyle(activeCategory.id as Exclude<ProductCategory, "earrings">, selectedVariant === v.id, v.id) } : { ...CHROME_HEADER_FONT, ...desktopRingVariantStyle(v.id) }}
              data-active={selectedVariant === v.id ? "true" : undefined}
            >
              {v.label}
            </VanishButton>
          ))}
        </div>
      )}
    </div>
  );
}
