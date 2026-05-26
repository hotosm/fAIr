import { create } from "zustand";

type TryFairState = {
  highlightStartMapping: boolean;
  setHighlightStartMapping: (value: boolean) => void;
};

export const useTryFairStore = create<TryFairState>((set) => ({
  highlightStartMapping: false,
  setHighlightStartMapping: (value) => set({ highlightStartMapping: value }),
}));
