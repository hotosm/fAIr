// store/zoomStore.ts
import { create } from "zustand";

type IStartMappingStore = {
  imagery: string;
  setImagery: (imagery: string) => void;
  downloadType: string;
  setDownloadType: (imagery: string) => void;
  showChooseLocationModal: boolean;
  setShowChooseLocationModal: (show: boolean) => void;
  showSigninModal: boolean;
  setShowSigninModal: (show: boolean) => void;
};

export const useStartMappingStore = create<IStartMappingStore>((set) => ({
  imagery: "",
  setImagery: (imagery) => set({ imagery }),
  downloadType: "",
  setDownloadType: (downloadType) => set({ downloadType }),
  showChooseLocationModal: false,
  setShowChooseLocationModal: (showChooseLocationModal) =>
    set({ showChooseLocationModal }),
  showSigninModal: false,
  setShowSigninModal: (showSigninModal) =>
    set({ showSigninModal }),
}));
