import { useQuery } from "@tanstack/react-query";
import { getTrainingDetailsQueryOptions, getTrainingFeedbacksQueryOptions, getTrainingWorkspaceQueryOptions } from "./factory";


export const useTrainingDetails = (id: number) => {
    return useQuery({
        ...getTrainingDetailsQueryOptions(id),
        //@ts-expect-error
        throwOnError: (error) => error?.response?.status >= 500,
    });
};



export const useTrainingFeedbacks = (id: number) => {
    return useQuery({
        ...getTrainingFeedbacksQueryOptions(id),
        //@ts-expect-error
        throwOnError: (error) => error?.response?.status >= 500,
    });
};
export const useTrainingWorkspace = (datasetId: number, trainingId: number, directory_name = '') => {
    return useQuery({
        ...getTrainingWorkspaceQueryOptions(datasetId, trainingId, directory_name),
        //@ts-expect-error
        throwOnError: (error) => error?.response?.status >= 500,
    });
};




