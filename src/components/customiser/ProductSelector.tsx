"use client";

import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";

interface ProductSelectorProps {
  selectedCategory: ProductCategory | null;
  selectedVariant:  ProductVariant | null;
  onSelect:         (category: ProductCategory, variant: ProductVariant) => void;
}

interface VariantOption { id: ProductVariant; label: string; }
interface CategoryOption { id: ProductCategory; label: string; variants: VariantOption[]; }

const CATEGORIES: CategoryOption[] = [
  {
    id: "ring",
    label: "Ring",
    variants: [
      { id: "ringClassic",       label: "Classic" },
      { id: "ringConcave",       label: "Concave" },
      { id: "ringConcaveTriple", label: "Concave Triple" },
    ],
  },
  {
    id: "pendant",
    label: "Pendant",
    variants: [
      { id: "pendantClassic", label: "Classic" },
      { id: "pendantLowSet",  label: "Low Set" },
    ],
  },
  {
    id: "earrings",
    label: "Earrings",
    variants: [],
  },
];

export default function ProductSelector({ selectedCategory, selectedVariant, onSelect }: ProductSelectorProps) {
  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory);

  const handleCategoryClick = (cat: CategoryOption) => {
    if (cat.variants.length === 0) {
      // Earrings — variant id matches category id
      onSelect(cat.id, cat.id as ProductVariant);
    } else {
      // Select first variant by default when switching category
      onSelect(cat.id, cat.variants[0].id);
    }
  };

  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">Piece</p>

      {/* Category buttons */}
      <div className="flex gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`flex-1 cursor-pointer border px-2 py-1.5 text-[11px] font-medium transition-colors duration-100 ${
              selectedCategory === cat.id
                ? "border-foreground bg-foreground text-surface"
                : "border-border bg-transparent text-foreground hover:border-border-strong"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Variant sub-options */}
      {activeCategory && activeCategory.variants.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {activeCategory.variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(activeCategory.id, v.id)}
              className={`flex-1 cursor-pointer border px-2 py-1 text-[10px] font-mono tracking-wide transition-colors duration-100 ${
                selectedVariant === v.id
                  ? "border-foreground text-foreground"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
