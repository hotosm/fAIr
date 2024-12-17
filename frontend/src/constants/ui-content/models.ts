import { TModelsPagesContent } from "@/types";

export const modelPagesContent: TModelsPagesContent = {
    trainingArea: {
        // The retry button when the training area map fails to load as a result of an API error or any other issue.
        retryButton: "retry",
        modalTitle: "Training Area",
        map: {
            loadingText: 'Loading map...'
        }
    },
    myModels: {
        pageTitle: "My Models",
        pageHeader: "My Models",
        pageDescription:
            "Your archived, draft and published models are here. Each model is trained using one of the training datasets. Published models can be used to find mappable features in imagery that is similar to the training areas that dataset comes from.",
    },
};
