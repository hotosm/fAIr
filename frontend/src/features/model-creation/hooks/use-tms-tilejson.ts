import { getTMSTileJSONQueryOptions } from '@/features/model-creation/api/factory';
import { useQuery } from '@tanstack/react-query';


export const useGetTMSTileJSON = (url: string) => {
  return useQuery({
    ...getTMSTileJSONQueryOptions(url),
  });
};
