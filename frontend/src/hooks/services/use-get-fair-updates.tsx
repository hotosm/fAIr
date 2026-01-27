import { FAIR_YOUTUBE_UPDATES_URL } from "@/config";
import { TFairUpdates } from "@/types";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the fair updates data from the GitHub repository.
 */
const getFairUpdates = async (): Promise<TFairUpdates> => {
  const res = await fetch(FAIR_YOUTUBE_UPDATES_URL);
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
