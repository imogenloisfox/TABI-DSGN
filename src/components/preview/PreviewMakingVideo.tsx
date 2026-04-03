"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";
import { variantCategory } from "@/lib/customiser/types";

const MAKING_VIDEO_SRC: Record<ProductCategory, string> = {
  ring:     "/videos/ring-making.mp4",
  pendant:  "/videos/pendant-making.mp4",
  earrings: "/videos/earring-making.mp4",
};

/**
 * Small looped "making of" clip for the customiser preview (desktop only — parent uses `md:flex`).
 * Muted autoplay; swaps file when jewellery category changes.
 */
export default function PreviewMakingVideo({ variant }: { variant: ProductVariant | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const category = variant ? variantCategory(variant) : null;
  const src = category ? MAKING_VIDEO_SRC[category] : null;

  useEffect(() => { setReadySrc(null); }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    el.load();
    const p = el.play();
    if (p !== undefined) void p.catch(() => {});
  }, [src]);

  if (!src) return null;

  const fadeIn = readySrc === src;

  return (
    <div
      className="pointer-events-none w-[200px] max-w-[200px] shrink-0 overflow-hidden shadow-none"
      aria-hidden
    >
      <video
        ref={ref}
        key={src}
        className={`block h-auto w-[200px] max-w-full border-0 bg-transparent shadow-none outline-none transition-opacity duration-500 ease-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
        width={200}
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
        onLoadedData={() => setReadySrc(src)}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
