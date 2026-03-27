"use client";

import type { CustomiserState } from "@/lib/customiser/types";
import { productUsesGemstone } from "@/lib/customiser/types";
import { PRODUCTS } from "@/data/products";
import { getGemstone } from "@/data/gemstones";
import { buildCheckoutPayload } from "@/lib/shopify/buildCheckoutPayload";

interface ReviewPanelProps {
  state: CustomiserState;
}

export default function ReviewPanel({ state }: ReviewPanelProps) {
  const product = state.variant ? PRODUCTS[state.variant] : null;
  const gemstone = state.gemstone ? getGemstone(state.gemstone) : null;
  const needsGem = productUsesGemstone(state.variant);
  const isComplete = Boolean(
    state.variant &&
      state.finish &&
      (!needsGem || state.gemstone) &&
      state.engraving.text
  );

  const handlePurchase = () => {
    const payload = buildCheckoutPayload(state);
    console.log("[TABI] Shopify checkout payload:", payload);
    alert(
      `Ready for Shopify handoff:\n\n${JSON.stringify(payload, null, 2)}\n\nShopify integration will be connected here.`
    );
  };

  return (
    <div className="flex h-full flex-col justify-between p-3">
      <div>
        <p className="mb-3 text-[10px] font-mono tracking-wide text-muted uppercase">
          Summary
        </p>
        <div className="flex flex-col gap-2 text-[11px]">
          <SummaryRow label="Piece" value={product?.label ?? "—"} />
          <SummaryRow
            label="Initial"
            value={state.engraving.text || "—"}
            valueClassName={state.engraving.text ? "font-script text-lg leading-none" : ""}
          />
          {needsGem && (
            <SummaryRow
              label="Stone"
              value={gemstone?.label ?? "—"}
              swatch={gemstone?.hex}
            />
          )}
          <SummaryRow
            label="Finish"
            value={state.finish ? state.finish.charAt(0).toUpperCase() + state.finish.slice(1) : "—"}
          />
        </div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={!isComplete}
        className="mt-4 w-full cursor-pointer border border-foreground bg-foreground px-3 py-2 text-[10px] font-medium tracking-[0.12em] uppercase text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue to Purchase
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  swatch,
  valueClassName = "",
}: {
  label: string;
  value: string;
  swatch?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-muted uppercase">{label}</span>
      <div className="flex items-center gap-1.5">
        {swatch && (
          <span
            className="inline-block h-2.5 w-2"
            style={{
              backgroundColor: swatch,
              clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
            }}
          />
        )}
        <span className={`text-foreground ${valueClassName}`}>{value}</span>
      </div>
    </div>
  );
}
