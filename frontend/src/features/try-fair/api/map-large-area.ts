import { API_ENDPOINTS, apiClient } from "@/services";
import { BBOX } from "@/types";
import { useMutation } from "@tanstack/react-query";

export type MapLargeAreaParams = {
  confidence_threshold?: number;
  [key: string]: unknown;
};

export type MapLargeAreaRequest = {
  model_stac_id: string;
  image_uri: string;
  /** Whole-imagery requests use the imagery extent. */
  bbox?: BBOX;
  /** Drawn/uploaded AOIs preserve their polygon in the request. */
  geom?: GeoJSON.Geometry;
  zoom: number;
  params?: MapLargeAreaParams;
  description?: string;
};

const submitMapLargeArea = async (payload: MapLargeAreaRequest) => {
  const res = await apiClient.post(
    API_ENDPOINTS.MAP_LARGE_AREA_REQUEST,
    payload,
  );
  return res.data;
};

export const useSubmitMapLargeArea = () => {
  return useMutation({
    mutationFn: (payload: MapLargeAreaRequest) => submitMapLargeArea(payload),
    mutationKey: ["map-large-area"],
  });
};
