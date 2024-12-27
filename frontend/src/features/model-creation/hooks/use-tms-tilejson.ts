import { useQuery } from "@tanstack/react-query";
import { getTMSTileJSONQueryOptions } from "@/features/model-creation/api/factory";


export const useGetTMSTileJSON = (url: string) => {
  return useQuery({
    ...getTMSTileJSONQueryOptions(url),
  });
};
