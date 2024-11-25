import { useQuery } from "@tanstack/react-query";
import { getTMSTileJSONQueryOptions } from "@/features/model-creation/api/factory";

export const useGetTMSTileJSON = (url: string) => {
  return useQuery({
    ...getTMSTileJSONQueryOptions(url),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
  });
};
