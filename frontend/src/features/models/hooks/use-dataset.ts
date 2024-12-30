import { getTrainingDatasetQueryOptions } from '../api/factory';
import { useQuery } from '@tanstack/react-query';

export const useGetTrainingDataset = (id: number, enabled: boolean = !!id) => {
  return useQuery({
    ...getTrainingDatasetQueryOptions(id),
    enabled: enabled,
  });
};
