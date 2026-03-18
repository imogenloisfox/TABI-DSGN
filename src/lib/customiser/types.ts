export type ProductType = "ring" | "pendant";

export type GemstoneId =
  | "garnet"
  | "topaz"
  | "citrine"
  | "peridot"
  | "white-cz"
  | "smoky-quartz"
  | "green-quartz";

export type FinishType = "shiny" | "matte";

export type AppView = "start" | "workspace";

export interface CustomiserState {
  view: AppView;
  product: ProductType | null;
  engravingInitial: string;
  gemstone: GemstoneId | null;
  finish: FinishType | null;
}

export const INITIAL_STATE: CustomiserState = {
  view: "start",
  product: null,
  engravingInitial: "",
  gemstone: null,
  finish: null,
};
