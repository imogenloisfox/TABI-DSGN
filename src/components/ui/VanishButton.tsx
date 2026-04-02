"use client";

import { useCallback, useRef, useState } from "react";
import VanishText from "./VanishText";

// ─── VanishButton ─────────────────────────────────────────────────────────────
//
// A <button> whose text label disperses into particles on every click.
// The text fades back in immediately after the last particle disappears.
//
// Usage: drop-in replacement for <button> when children is a plain string label.

type VanishButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: string;
  /**
   * When true, `onClick` runs after the particle animation finishes (same moment as text fade-in).
   * Use for actions that change layout (e.g. opening a panel) so particles stay visible.
   */
  deferOnClick?: boolean;
};

export default function VanishButton({
  children,
  onClick,
  disabled,
  className,
  style,
  deferOnClick = false,
  ...rest
}: VanishButtonProps) {
  const [vanishing, setVanishing] = useState(false);
  const clickEventRef = useRef<React.MouseEvent<HTMLButtonElement> | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || vanishing) return;
    clickEventRef.current = e;
    setVanishing(true);
    if (!deferOnClick) {
      onClick?.(e);
    }
  };

  const handleDone = useCallback(() => {
    setVanishing(false);
    if (deferOnClick && clickEventRef.current) {
      onClick?.(clickEventRef.current);
      clickEventRef.current = null;
    }
  }, [deferOnClick, onClick]);

  return (
    <button
      {...rest}
      disabled={disabled}
      className={[className, "lowercase"].filter(Boolean).join(" ")}
      style={style}
      onClick={handleClick}
    >
      <VanishText text={children} trigger={vanishing} onDone={handleDone} />
    </button>
  );
}
