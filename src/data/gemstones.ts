import type { GemstoneId } from "@/lib/customiser/types";

export interface GemstoneOption {
  id: GemstoneId;
  label: string;
  hex: string;
  shopifyValue: string;
}

export const GEMSTONES: GemstoneOption[] = [
  { id: "white-cz",         label: "white cz",         hex: "#f5f8fb", shopifyValue: "White CZ" },
  { id: "topaz",            label: "topaz",            hex: "#ddeff8", shopifyValue: "Topaz" },
  { id: "amethyst",         label: "amethyst",         hex: "#ae96cf", shopifyValue: "Amethyst" },
  { id: "pink-tourmaline",  label: "lab ruby",         hex: "#c42a56", shopifyValue: "Lab Ruby" },
  { id: "garnet",           label: "garnet",           hex: "#6e121f", shopifyValue: "Garnet" },
  { id: "hessonite",        label: "dark citrine",     hex: "#a84a10", shopifyValue: "Dark Citrine" },
  { id: "citrine",          label: "lemon quartz",     hex: "#fef6b2", shopifyValue: "Lemon Quartz" },
  { id: "peridot",          label: "peridot",          hex: "#d0e76e", shopifyValue: "Peridot" },
  { id: "green-quartz",     label: "green quartz",     hex: "#ecefe8", shopifyValue: "Green Quartz" },
  { id: "smoky-quartz",     label: "smoky quartz",     hex: "#7d6b5c", shopifyValue: "Smoky Quartz" },
  { id: "iolite",           label: "iolite",           hex: "#4a449e", shopifyValue: "Iolite" },
];

export function getGemstone(id: GemstoneId): GemstoneOption | undefined {
  return GEMSTONES.find((g) => g.id === id);
}

/** Uniform index in [0, n) — prefers `crypto.getRandomValues` when available. */
export function randomGemstoneIndex(n: number): number {
  if (n <= 1) return 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! % n;
  }
  return Math.floor(Math.random() * n);
}

/**
 * Random gem id for remix / UI. Omits `exclude` from the pool so the next stone
 * differs from the one on screen when possible (falls back to full list if empty).
 */
export function pickRandomGemstoneId(exclude?: GemstoneId): GemstoneId {
  const pool = exclude
    ? GEMSTONES.filter((g) => g.id !== exclude)
    : GEMSTONES;
  const list = pool.length > 0 ? pool : GEMSTONES;
  return list[randomGemstoneIndex(list.length)]!.id;
}
