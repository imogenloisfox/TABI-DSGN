/**
 * FPS pill + WebGL collector — on in local dev; on Vercel builds (see `next.config.ts`
 * NEXT_PUBLIC_VERCEL_DEPLOY) unless NEXT_PUBLIC_SHOW_FPS is "false"/"0"/"off".
 */
export function showFpsOverlay(): boolean {
  const v = process.env.NEXT_PUBLIC_SHOW_FPS;
  if (v === "0" || v === "false" || v === "off") return false;
  if (v === "1" || v === "true" || v === "on" || v === "yes") return true;
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_VERCEL_DEPLOY === "1";
}
