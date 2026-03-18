import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getModelDetails } from "@/features/models/api/get-models";
import { QUERY_KEYS } from "@/services";
import { TOfflinePrediction } from "@/types";

type PredictionModelMeta = {
  modelNamesById: Record<string, string>;
  modelOwnersById: Record<string, string>;
};

export const usePredictionModelsMeta = (
  predictions: TOfflinePrediction[],
): PredictionModelMeta => {
  const modelIds = useMemo(
    () =>
      Array.from(
        new Set(
          predictions
            .map((prediction) => prediction.config.model_id)
            .filter(Boolean),
        ),
      ),
    [predictions],
  );

  const modelDetailsQueries = useQueries({
    queries: modelIds.map((modelId) => ({
      queryKey: [QUERY_KEYS.MODEL_DETAILS(modelId)],
      queryFn: () => getModelDetails(modelId),
      enabled: !!modelId,
    })),
  });

  return useMemo(
    () =>
      modelIds.reduce(
        (acc, modelId, index) => {
          const modelInfo = modelDetailsQueries[index]?.data;
          if (modelInfo?.name) {
            acc.modelNamesById[modelId] = modelInfo.name;
          }
          if (modelInfo?.user?.username) {
            acc.modelOwnersById[modelId] = modelInfo.user.username;
          }
          return acc;
        },
        {
          modelNamesById: {},
          modelOwnersById: {},
        } as PredictionModelMeta,
      ),
    [modelIds, modelDetailsQueries],
  );
};
