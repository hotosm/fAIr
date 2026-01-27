import { ENVS } from "@/config/env";
import { TFairUpdates } from "@/types";
import { useQuery } from "@tanstack/react-query";

const FAIR_UPDATES_URL =
  ENVS.FAIR_YOUTUBE_UPDATES_URL ||
  "https://raw.githubusercontent.com/hotosm/fAIr/develop/docs/assets/fair-updates.json";

/**
 * Fetches the fair updates data from the GitHub repository.
 */
const getFairUpdates = async (): Promise<TFairUpdates> => {
  const res = await fetch(FAIR_UPDATES_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch fair updates: ${res.statusText}`);
  }
  return res.json();
};

export const useFairUpdates = () => {
  return useQuery({
    queryKey: ["fair-updates"],
    queryFn: getFairUpdates,
  });
};
