import { API_ENDPOINTS, apiClient, MutationConfig } from "@/services";
import { useTrainingHistory } from "../hooks/use-training";
import { useModelDetails } from "../hooks/use-models";
import { useMutation } from "@tanstack/react-query";
import { PAGE_LIMIT } from "../components/pagination";


export const updateTraining = (trainingId: number) => {
    return apiClient.post(`${API_ENDPOINTS.UPDATE_TRAINING(trainingId)}`);
};

type UseUpdateTrainingOptions = {
    mutationConfig?: MutationConfig<typeof updateTraining>;
    modelId: number
};

export const useUpdateTraining = ({
    mutationConfig, modelId
}: UseUpdateTrainingOptions) => {
    const { refetch: refetchModelDetails } = useModelDetails(String(modelId));
    const { refetch: refetchTrainingHistory } = useTrainingHistory(String(modelId), 0, PAGE_LIMIT);

    const { onSuccess, ...restConfig } = mutationConfig || {};

    return useMutation({
        onSuccess: (...args) => {
            refetchModelDetails();
            refetchTrainingHistory();
            onSuccess?.(...args);
        },
        ...restConfig,
        mutationFn: updateTraining,
    });
};