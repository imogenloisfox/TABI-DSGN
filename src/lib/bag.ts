import type { CustomiserState } from "@/lib/customiser/types";

export interface BagItem {
  id:       string;          // unique per item (crypto.randomUUID or Date.now fallback)
  state:    CustomiserState;
  shareUrl: string;
  label:    string;          // e.g. "moi ring"
  price:    number;          // GBP
  /** 3D renders captured at add-to-bag time */
  renders?: {
    heroFrontView: string | null;
    renderViews:   { front: string; left: string; right: string } | null;
  };
}
