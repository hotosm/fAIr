// store/zoomStore.ts
import { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { create } from "zustand";

type IStartMappingStore = {
  selectedImagery: ImagerySelection | null;
  setSeletedImagery: (imagery: ImagerySelection | null) => void;

  downloadType: string;
  setDownloadType: (imagery: string) => void;
  showChooseLocationModal: boolean;
  setShowChooseLocationModal: (show: boolean) => void;
  showSigninModal: boolean;
  setShowSigninModal: (show: boolean) => void;
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  currentModelType: "demo" | "imagery";
  setCurrentModelType: (type: "demo" | "imagery") => void;
};

export const useStartMappingStore = create<IStartMappingStore>((set) => ({
  selectedImagery: null,
  setSeletedImagery: (selectedImagery) => set({ selectedImagery }),
  downloadType: "",
  setDownloadType: (downloadType) => set({ downloadType }),
  showChooseLocationModal: false,
  setShowChooseLocationModal: (showChooseLocationModal) =>
    set({ showChooseLocationModal }),
  showSigninModal: false,
  setShowSigninModal: (showSigninModal) => set({ showSigninModal }),
  showShareModal: false,
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  currentModelType: "demo",
  setCurrentModelType: (currentModelType) => set({ currentModelType }),
}));
