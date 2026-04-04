"use client";

// ─── VanishButton ─────────────────────────────────────────────────────────────
//
// Plain button wrapper — formerly had particle dispersion on click,
// now just a styled <button> that fires onClick immediately.

type VanishButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: string;
  /** Legacy prop — ignored. Kept for call-site compatibility. */
  deferOnClick?: boolean;
};

export default function VanishButton({
  children,
  onClick,
  disabled,
  className,
  style,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deferOnClick = false,
  ...rest
}: VanishButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[className, "lowercase"].filter(Boolean).join(" ")}
      style={style}
      onClick={onClick}
    >
      <span>{children}</span>
    </button>
  );
}
