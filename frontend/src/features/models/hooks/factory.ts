import { queryOptions, keepPreviousData, } from '@tanstack/react-query';
import { getModels, getModelDetails, getModelsMapData } from '@/features/models/api/get-models';
import { getTrainingDetails } from '@/features/models/api/get-trainings';


// Models

type TModelQueryOptions = {
  limit: number;
  offset: number;
  orderBy: string;
  searchQuery: string;
  dateFilters: Record<string, string>,
  status: number;
};

export const getModelsQueryOptions = ({
  status,
  searchQuery,
  limit,
  offset,
  orderBy,
  dateFilters,
}: TModelQueryOptions) => {
  return queryOptions({
    queryKey: ['models', { status, searchQuery, offset, orderBy, dateFilters, }],
    queryFn: () => getModels(limit, offset, orderBy, status, searchQuery, dateFilters,),
    placeholderData: keepPreviousData,
  });
};

export const getModelDetailsQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ['model-details', id],
    queryFn: () => getModelDetails(id),
  });
};

export const getModelsMapDataQueryOptions = () => {
  return queryOptions({
    queryKey: ['models-centroid'],
    queryFn: getModelsMapData,
  });
};


// Training

export const getTrainingDetailsQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: ['training-details', id],
    queryFn: () => getTrainingDetails(id),
  });
};