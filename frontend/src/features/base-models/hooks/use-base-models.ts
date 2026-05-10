import { useQuery } from "@tanstack/react-query";
import { getBaseModelById, getBaseModels } from "../api/get-base-models";
import {
  mapStacItemToBaseModel,
  mapStacItemToBaseModelDetail,
} from "../utils/stac";

export const useBaseModels = () => {
  return useQuery({
    queryKey: ["base-models"],
    queryFn: async () => {
      const data = await getBaseModels();
      return data.features.map(mapStacItemToBaseModel);
    },
  });
};

export const useBaseModel = (id?: string) => {
  return useQuery({
    queryKey: ["base-model", id],
    queryFn: async () => {
      const data = await getBaseModelById(id as string);
      return mapStacItemToBaseModelDetail(data);
    },
    enabled: !!id,
  });
};
