/**
 * Single source of truth for the floating info/play panel motion in App.tsx.
 * Customiser sidebar top inset follows measured chrome height (no separate padding transition)
 * so it stays in sync with the grid/transform animation.
 */
export const FLOATING_PANEL_MOTION_MS = 300;
export const FLOATING_PANEL_EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

export function floatingPanelCssTransition(property: string): string {
  return `${property} ${FLOATING_PANEL_MOTION_MS}ms ${FLOATING_PANEL_EASING}`;
}
