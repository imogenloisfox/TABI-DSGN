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
      { id: "ringClassic", label: "Type 01" },
      { id: "ringConcave", label: "Type 02" },
    ],
  },
  {
    id: "pendant",
    label: "Pendant",
    variants: [
      { id: "pendantOne", label: "Type 01" },
      { id: "pendantTwo", label: "Type 02" },
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
    <div className="bg-background px-3 py-2.5">
      <p className="mb-2 text-[10px] font-mono tracking-wide text-foreground uppercase">Jewellery</p>

      {/* Category buttons */}
      <div className="flex gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`btn-primary flex-1 cursor-pointer border border-foreground px-2 py-1.5 text-[10px] font-mono ${
              selectedCategory === cat.id
                ? "bg-foreground text-surface"
                : "bg-surface text-black"
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
              className={`btn-primary flex-1 cursor-pointer border border-foreground px-2 py-1.5 text-[10px] font-mono ${
                selectedVariant === v.id
                  ? "bg-foreground text-surface"
                  : "bg-surface text-black"
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
