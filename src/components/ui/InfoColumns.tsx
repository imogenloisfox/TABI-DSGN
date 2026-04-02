"use client";

import { uiFontStyle } from "@/lib/uiFont";

const BODY  = { ...uiFontStyle, fontWeight: 700 as const };
const LABEL = { ...uiFontStyle, fontWeight: 700 as const };

/**
 * Info panel — matches PlayHintPanel width (w-fit, max 20rem). Single column, gap-2 sections, no dividers.
 */
export default function InfoColumns() {
  return (
    <div
      className="flex h-full min-h-0 w-fit max-w-[min(100%,calc(100vw-2rem))] flex-col justify-end border-0 bg-[#d9d9d9] p-4 shadow-none ring-0 outline-none [backface-visibility:hidden]"
      style={BODY}
    >
      <div className="flex min-h-0 w-fit max-w-[min(20rem,calc(100vw-2.5rem))] flex-col gap-2">
        {/* Information */}
        <div className="min-w-0">
          <p className="mb-1 text-[10px] leading-none text-[#7a7a7a]" style={LABEL}>
            Information
          </p>
          <p className="max-w-full text-[9px] leading-[1.45] text-[#2a2c2d]">
            This website is a collaboration between Tabitha Sullivan&nbsp;(a) and Imogen
            Fox&nbsp;(b). Founded by&nbsp;(a), TABI DSGN is a jewellery brand created to honour
            the feminine form. This customisation tool has been designed and built by&nbsp;(b),
            allowing you to create your own version of each piece.
          </p>
        </div>

        {/* Instructions */}
        <div className="min-w-0">
          <p className="mb-1 text-[10px] leading-none text-[#7a7a7a]" style={LABEL}>
            Instructions
          </p>
          <p className="max-w-full text-[9px] leading-[1.45] text-[#2a2c2d]">
            Select a jewellery piece to customise, then choose your finish, gemstone, and engraving.
            Use the sliders to adjust X, Y, and scale. Press Enter for multi-line text, and use the
            spacing slider to refine it. Hit &lsquo;Remix&rsquo; for inspiration, &lsquo;Reset&rsquo; to start
            over, or &lsquo;Save&rsquo; to keep your design. When you&rsquo;re ready, click &lsquo;Buy&rsquo; to
            continue to Shopify, where your piece will be crafted by&nbsp;(a) to reflect your
            customisation.
          </p>
        </div>

        {/* Contact */}
        <div className="min-w-0">
          <p className="mb-1 text-[10px] leading-none text-[#7a7a7a]" style={LABEL}>
            Contact
          </p>
          <p className="max-w-full text-[9px] leading-[1.45] text-[#2a2c2d]">
            (a)&nbsp;
            <a
              href="https://tabidsgn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2a2c2d] underline underline-offset-[3px]"
            >
              tabidsgn.com
            </a>
          </p>
          <p className="mt-1 max-w-full text-[9px] leading-[1.45] text-[#2a2c2d]">
            (b)&nbsp;
            <a
              href="https://imogenfox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2a2c2d] underline underline-offset-[3px]"
            >
              imogenfox.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
