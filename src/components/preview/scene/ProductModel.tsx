/**
 * Product model component.
 *
 * Renders a ring or pendant using placeholder geometry first, then swaps in
 * real GLB models via useGLTF when they are ready.
 *
 * Placeholder geometry shapes:
 *   Ring:    wide cylinder (torus with large inner radius, wide cross-section)
 *            representing the signet band. Stone sits as a small box at the
 *            front face.
 *   Pendant: thin box slab with a small bail cylinder on top and a stone box
 *            centered on the front face.
 *
 * Material mapping:
 *   Shiny  -> MeshStandardMaterial { metalness: 1, roughness: 0.1 }
 *   Matte  -> MeshStandardMaterial { metalness: 0.9, roughness: 0.5 }
 *   Stone  -> MeshPhysicalMaterial { transmission, ior, color from gemstone hex }
 *
 * Engraving approach:
 *   Phase 1: HTML overlay (current flat preview approach)
 *   Phase 2: Dynamic canvas texture mapped as a decal to the engraving zone
 *   Phase 3: Potential geometry-based engraving with supplied font outlines
 *
 * Model swap:
 *   Place optimised GLB files at:
 *     public/models/ring.glb
 *     public/models/pendant.glb
 *   Then replace the placeholder geometry with useGLTF hooks.
 *   The existing ring.gltf in the TABI-ENGRAVING folder can be used as a
 *   starting point once optimised.
 */

import type { ProductType, GemstoneId, FinishType } from "@/lib/customiser/types";

export interface ProductModelProps {
  product: ProductType;
  gemstone: GemstoneId | null;
  finish: FinishType | null;
  engravingInitial: string;
}

export default function ProductModel(_props: ProductModelProps) {
  return null;
}
