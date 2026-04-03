"use client";

import VanishButton from "@/components/ui/VanishButton";
import { CHROME_HEADER_FONT, CHROME_LABEL_FONT, chromePillCta } from "@/lib/chromeUi";

interface StartPromptProps {
  onStart: () => void;
}

export default function StartPrompt({ onStart }: StartPromptProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-script text-5xl leading-none text-foreground md:text-7xl">
          TABI
        </h1>
        <p className="text-[10px] tracking-normal text-[#676767]" style={CHROME_LABEL_FONT}>
          Engraving customiser
        </p>
      </div>

      <p
        className="max-w-xs text-[10px] leading-relaxed tracking-normal text-[#676767]"
        style={CHROME_LABEL_FONT}
      >
        Design your own personalised piece.
      </p>

      <VanishButton
        onClick={onStart}
        className={chromePillCta}
        style={CHROME_HEADER_FONT}
      >
        open customiser
      </VanishButton>
    </div>
  );
}
