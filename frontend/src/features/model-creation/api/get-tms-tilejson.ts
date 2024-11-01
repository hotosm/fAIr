import { apiClient } from "@/services";
import { TileJSON } from "@/types";

export const getTMSTileJSON = async (url: string): Promise<TileJSON> => {
  const res = await apiClient.get(url);
  return res.data;
};
