import type { GemstoneId } from "@/lib/customiser/types";

export interface GemstoneOption {
  id: GemstoneId;
  label: string;
  hex: string;
  shopifyValue: string;
}

export const GEMSTONES: GemstoneOption[] = [
  { id: "white-cz", label: "White CZ", hex: "#e8e6e3", shopifyValue: "White CZ" },
  { id: "garnet", label: "Garnet", hex: "#6e1423", shopifyValue: "Garnet" },
  { id: "topaz", label: "Topaz", hex: "#4a7c9b", shopifyValue: "Topaz" },
  { id: "citrine", label: "Citrine", hex: "#c9a227", shopifyValue: "Citrine" },
  { id: "peridot", label: "Peridot", hex: "#6b8e23", shopifyValue: "Peridot" },
  { id: "smoky-quartz", label: "Smoky Quartz", hex: "#5c4033", shopifyValue: "Smoky Quartz" },
  { id: "green-quartz", label: "Green Quartz", hex: "#8fbc8f", shopifyValue: "Green Quartz" },
];

export function getGemstone(id: GemstoneId): GemstoneOption | undefined {
  return GEMSTONES.find((g) => g.id === id);
}
