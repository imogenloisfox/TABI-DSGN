"use client";

import { CHROME_HEADER_FONT, CHROME_TOP_PILL_BASE } from "@/lib/chromeUi";

type Props =
  | { href: string;  onClick?: never; loading?: never }
  | { href?: never;  onClick: () => void; loading?: boolean };

const LINK_CLASS = `${CHROME_TOP_PILL_BASE} buy-pill-link relative w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`;

export default function PreviewBuyPillLink({ href, onClick, loading = false }: Props) {
  const sharedProps = {
    className: LINK_CLASS,
    style: { ...CHROME_HEADER_FONT, boxShadow: "none", textDecoration: "none" } as React.CSSProperties,
  };

  const inner = (
    <span className="buy-pill-label">{loading ? "..." : "buy"}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        {...sharedProps}
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...sharedProps}
    >
      {inner}
    </a>
  );
}
