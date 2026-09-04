import { ModelType, TryFairMapOutputType } from "@/enums";
import { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { BBOX } from "@/types";
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
  currentModelType: ModelType;
  setCurrentModelType: (type: ModelType) => void;

  /** Current prediction results — synced from the try-fair page. */
  predictions: GeoJSON.FeatureCollection | null;
  setPredictions: (predictions: GeoJSON.FeatureCollection | null) => void;
  predictionBBox: BBOX | null;
  setPredictionBBox: (bbox: BBOX | null) => void;
  predictionGridZoom: number | null;
  setPredictionGridZoom: (zoom: number | null) => void;
  outputType: TryFairMapOutputType;
  setOutputType: (type: TryFairMapOutputType) => void;
};

export const useStartMappingStore = create<IStartMappingStore>((set) => ({
  selectedImagery: null,
  setSeletedImagery: (selectedImagery) => set({ selectedImagery }),
  downloadType: "",
  setDownloadType: (downloadType) => set({ downloadType }),
  showChooseLocationModal: false,
  setShowChooseLocationModal: (showChooseLocationModal) => set({ showChooseLocationModal }),
  showSigninModal: false,
  setShowSigninModal: (showSigninModal) => set({ showSigninModal }),
  showShareModal: false,
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  currentModelType: ModelType.DEMO,
  setCurrentModelType: (currentModelType) => set({ currentModelType }),

  predictions: null,
  setPredictions: (predictions) => set({ predictions }),
  predictionBBox: null,
  setPredictionBBox: (predictionBBox) => set({ predictionBBox }),
  predictionGridZoom: null,
  setPredictionGridZoom: (predictionGridZoom) => set({ predictionGridZoom }),
  outputType: TryFairMapOutputType.POLYGON,
  setOutputType: (outputType) => set({ outputType }),
}));
