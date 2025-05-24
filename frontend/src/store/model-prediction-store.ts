import { create } from "zustand";
import { TModelPredictionFeature } from "@/types";
import { PredictedFeatureStatus } from "@/enums/start-mapping";

type ModelPredictionState = {
  features: TModelPredictionFeature[];
  setFeatures: (features: TModelPredictionFeature[]) => void;
  updateFeatureStatus: (
    id: number,
    status: PredictedFeatureStatus,
    updatedProperties: Partial<TModelPredictionFeature["properties"]>,
  ) => void;
};

export const useModelPredictionStore = create<ModelPredictionState>(
  (set, get) => ({
    features: [],
    setFeatures: (features) => set({ features }),
    updateFeatureStatus: (id, status, updatedProperties = {}) => {
      const updated = get().features.map((f) =>
        f.properties.id === id
          ? {
              ...f,
              properties: { ...f.properties, status, ...updatedProperties },
            }
          : f,
      );
      set({ features: updated });
    },
  }),
);
