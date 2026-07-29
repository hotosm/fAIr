import { API_ENDPOINTS, apiClient } from "@/services";
import { BBOX } from "@/types";
import { useMutation } from "@tanstack/react-query";

export type MapLargeAreaParams = {
  confidence_threshold?: number;
  remove_osm?: boolean;
  [key: string]: unknown;
};

export type MapLargeAreaRequest = {
  model_stac_id: string;
  image_uri: string;
  bbox: BBOX;
  zoom: number;
  params?: MapLargeAreaParams;
  remove_osm?: boolean;
  description?: string;
};

const submitMapLargeArea = async (payload: MapLargeAreaRequest) => {
  const res = await apiClient.post(
    API_ENDPOINTS.MAP_LARGE_AREA_REQUEST,
    payload,
  );
  return res.data;
};

export const useMapLargeArea = () => {
  return useMutation({
    mutationFn: (payload: MapLargeAreaRequest) => submitMapLargeArea(payload),
    mutationKey: ["map-large-area"],
  });
};
