import { TModelPredictions } from "@/types";
import {
    MIN_ZOOM_LEVEL_FOR_PREDICTION,
    MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
    showErrorToast,
    showSuccessToast,
    uuid4,
} from "@/utils";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";
import { Button } from "@/components/ui/button";
import { booleanIntersects } from "@turf/boolean-intersects";
import { APPLICATION_CONTENTS, TOAST_NOTIFICATIONS } from "@/contents";
import { useCallback } from "react";
import { useMap } from "@/app/providers/map-provider";
import { TModelPredictionsConfig } from "../api/get-model-predictions";

const ModelAction = ({
    setModelPredictions,
    modelPredictions,
    trainingConfig,
}: {
    trainingConfig: TModelPredictionsConfig;
    modelPredictions: TModelPredictions;
    setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
}) => {
    const { map, currentZoom } = useMap();

    const disablePredictionButton = currentZoom < MIN_ZOOM_LEVEL_FOR_PREDICTION;

    const modelPredictionMutation = useGetModelPredictions({
        mutationConfig: {
            onSuccess: (data) => {
                showSuccessToast(
                    TOAST_NOTIFICATIONS.startMapping.modelPrediction.success,
                );

                const existingFeatures = [
                    ...modelPredictions.accepted,
                    ...modelPredictions.rejected,
                ];

                // Filter out new features that intersect with any existing feature
                const nonIntersectingFeatures =
                    data.features.length > 0
                        ? data.features.filter((newFeature) => {
                            return !existingFeatures.some((existingFeature) => {
                                return booleanIntersects(newFeature, existingFeature);
                            });
                        })
                        : [];
                setModelPredictions((prev) => ({
                    ...prev,
                    all: [
                        ...prev.all,
                        ...nonIntersectingFeatures.map((feature) => ({
                            ...feature,
                            properties: {
                                ...feature.properties,
                                id: uuid4(), // Add a unique ID to the properties for future use
                            },
                        })),
                    ],
                }));
            },
            onError: (error) => showErrorToast(error),
        },
    });

    const handlePrediction = useCallback(async () => {
        if (!map) return;
        await modelPredictionMutation.mutateAsync(trainingConfig);
    }, [trainingConfig]);

    return (
        <div className="flex gap-y-3 flex-col-reverse flex-wrap  md:items-center md:flex-row md:justify-between md:gap-x-2 md:flex-nowrap">
            {disablePredictionButton && (
                <p className="text-primary text-xs md:text-nowrap italic">
                    {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
                </p>
            )}
            <Button
                disabled={disablePredictionButton || modelPredictionMutation.isPending}
                onClick={handlePrediction}
                className="!w-fit"
            >
                {modelPredictionMutation.isPending
                    ? APPLICATION_CONTENTS.START_MAPPING.buttons.predictionInProgress
                    : APPLICATION_CONTENTS.START_MAPPING.buttons.runPrediction}
            </Button>
        </div>
    );
};

export default ModelAction;