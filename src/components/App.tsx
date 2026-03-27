"use client";

import { useState, useCallback } from "react";
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";
import HomepageScene from "./homepage/HomepageScene";
import CustomiserExperience from "./customiser/CustomiserExperience";

export default function App() {
  const [view, setView]                         = useState<"showcase" | "customiser">("showcase");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedVariant, setSelectedVariant]   = useState<ProductVariant | null>(null);
  const [transitioning, setTransitioning]       = useState(false);

  // Showcase piece clicked → exit showcase → enter customiser with the exact piece pre-selected
  const handlePieceClick = useCallback((category: ProductCategory, variant: ProductVariant) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCategory(category);
      setSelectedVariant(variant);
      setView("customiser");
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  // Back button pressed → exit customiser → return to showcase
  const handleBack = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setView("showcase");
      setSelectedCategory(null);
      setSelectedVariant(null);
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  return (
    <div className="h-dvh w-full overflow-hidden bg-background">
      {view === "showcase" && (
        <HomepageScene
          onPieceClick={handlePieceClick}
          exiting={transitioning}
        />
      )}
      {view === "customiser" && selectedCategory && (
        <CustomiserExperience
          initialCategory={selectedCategory}
          initialVariant={selectedVariant ?? undefined}
          onBack={handleBack}
          exiting={transitioning}
        />
      )}
    </div>
  );
}
