import type { GemstoneId } from "@/lib/customiser/types";

export interface GemstoneOption {
  id: GemstoneId;
  label: string;
  hex: string;
  shopifyValue: string;
}

export const GEMSTONES: GemstoneOption[] = [
  { id: "white-cz",         label: "White CZ",         hex: "#f5f8fb", shopifyValue: "White CZ" },
  { id: "amethyst",         label: "Amethyst",         hex: "#b9a5d5", shopifyValue: "Amethyst" },
  { id: "garnet",           label: "Garnet",           hex: "#7c051f", shopifyValue: "Garnet" },
  { id: "topaz",            label: "Topaz",            hex: "#b1d7e5", shopifyValue: "Topaz" },
  { id: "citrine",          label: "Citrine",          hex: "#fff7ae", shopifyValue: "Citrine" },
  { id: "peridot",          label: "Peridot",          hex: "#dbeb63", shopifyValue: "Peridot" },
  { id: "smoky-quartz",     label: "Smoky Quartz",     hex: "#724d2d", shopifyValue: "Smoky Quartz" },
  { id: "green-quartz",     label: "Green Quartz",     hex: "#3b6938", shopifyValue: "Green Quartz" },
  { id: "pink-tourmaline",  label: "Pink Tourmaline",  hex: "#d145a9", shopifyValue: "Pink Tourmaline" },
  { id: "hessonite",        label: "Hessonite",        hex: "#b45715", shopifyValue: "Hessonite" },
];

export function getGemstone(id: GemstoneId): GemstoneOption | undefined {
  return GEMSTONES.find((g) => g.id === id);
}
