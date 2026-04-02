"use client";

import { CHROME_HEADER_FONT, CHROME_TOP_PILL_BASE } from "@/lib/chromeUi";
import { usePresenceCount } from "@/hooks/usePresenceCount";

/** Matches dev FPS pill chrome (no hover — read-only). */
const PILL_TAIL =
  "w-[100px] shrink-0 justify-center tabular-nums normal-case lowercase !bg-[#b1b1b1] !text-[#2a2c2d] !cursor-default select-none";

export default function PreviewOnlinePill() {
  const count = usePresenceCount(true);

  const label =
    count === null ? "…" : count === 1 ? "1 online" : `${count} online`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        count === null
          ? "Loading number of people online"
          : `${count} ${count === 1 ? "person" : "people"} online in this session`
      }
      className={`${CHROME_TOP_PILL_BASE} ${PILL_TAIL}`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
    >
      {label}
    </div>
  );
}
