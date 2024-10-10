import { useQuery } from "@tanstack/react-query";
import { getTrainingDetailsQueryOptions } from "./factory";


export const useTrainingDetails = (id: number) => {
    return useQuery({
        ...getTrainingDetailsQueryOptions(id),
        //@ts-expect-error
        throwOnError: (error) => error?.response?.status >= 500,
    });
};

