"use client";

import { uiFontStyle } from "@/lib/uiFont";

const BODY  = { ...uiFontStyle, fontWeight: 700 as const };
const LABEL = { ...uiFontStyle, fontWeight: 400 as const };

/**
 * Narrow panel sized to copy (w-fit); still fills panel height so text stays bottom-aligned.
 */
export default function PlayHintPanel() {
  return (
    <div
      className="flex h-full min-h-0 w-fit max-w-[min(100%,calc(100vw-2rem))] flex-col justify-end border-0 bg-[#b1b1b1] p-4 shadow-none ring-0 outline-none [backface-visibility:hidden]"
      style={BODY}
    >
      <div className="min-w-0 max-w-[min(20rem,calc(100vw-2.5rem))]">
        <p className="mb-2 text-[10px] leading-tight text-[#f2f2f2]" style={LABEL}>
          Playtime
        </p>
        <p className="text-[9px] leading-[1.45] text-[#000000]">
          Spend time in the lobby of your TABI DSGN customisation experience. Hover over an object to
          bring it into focus. Click anywhere to scatter the jewellery. When you’re ready, select
          your chosen piece to begin customising.
        </p>
      </div>
    </div>
  );
}
