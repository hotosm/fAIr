import { Popup } from "@/components/ui/popup";
import { useModelDetails } from "../hooks/use-models";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { extractDatePart, roundNumber, truncateString } from "@/utils";
import { TModelDetails } from "@/types";
import { useGetTrainingDataset } from "../hooks/use-dataset";
import { useTrainingDetails } from "../hooks/use-training";

const ModelDetailsPopUp = ({
    showPopup,
    anchor,
    closePopup,
    modelId,
    model,
}: {
    showPopup: boolean;
    anchor: string;
    closePopup: () => void;
    modelId?: string;
    model?: TModelDetails;
}) => {
    const { data, isPending, isError } = useModelDetails(
        modelId as string,
        modelId !== undefined,
    );

    const {
        data: datasetInfo,
        isPending: datasetInfoIsPending,
        isError: datasetInfoIsError,
    } = useGetTrainingDataset(model?.dataset ?? (data?.dataset as number));

    const {
        data: trainingDetails,
        isPending: trainingDetailsIsPending,
        isError: trainingDetailsError,
    } = useTrainingDetails(
        model?.published_training ?? (data?.published_training as number),
    );


    return (
        <Popup
            active={showPopup}
            anchor={anchor}
            placement="bottom-start"
            distance={10}
        >
            {
                <SkeletonWrapper showSkeleton={Boolean(modelId && isPending)}>
                    <div className="max-h-[500px] overflow-y-scroll border bg-white border-gray-border w-80 shadown-sm shadow-[#433D3D33]  p-5 flex flex-col">
                        {isError ? (
                            <div>Error retrieving model information.</div>
                        ) : (
                            <div className="flex flex-col gap-y-4 text-dark">
                                <div className="flex justify-between flex-row-reverse items-center">
                                    <button
                                        className="text-dark text-lg self-end"
                                        onClick={closePopup}
                                        title="Close"
                                    >
                                        &#x2715;
                                    </button>
                                    <p>Model Details</p>
                                </div>
                                <div className="flex flex-col gap-y-2">
                                    <p className="text-gray">
                                        {" "}
                                        Model ID:{" "}
                                        <span className="text-dark">{model?.id ?? data?.id}</span>
                                    </p>
                                    <p className="text-gray">
                                        Description:{" "}
                                        <span className="text-dark">
                                            {model?.description ?? data?.description}
                                        </span>
                                    </p>
                                    <p className="text-gray">
                                        Last Modified:{" "}
                                        <span className="text-dark">
                                            {extractDatePart(
                                                model?.last_modified ?? (data?.last_modified as string),
                                            )}
                                        </span>
                                    </p>
                                    <p className="text-gray">
                                        Training ID:{" "}
                                        <span className="text-dark">
                                            {model?.published_training ?? data?.published_training}
                                        </span>
                                    </p>
                                    <p className="text-gray">
                                        Dataset ID:{" "}
                                        <span className="text-dark">
                                            {model?.dataset ?? data?.dataset}
                                        </span>
                                    </p>
                                    <p className="text-gray flex items-center gap-x-1 text-nowrap flex-wrap">
                                        Dataset Name:{" "}
                                        <SkeletonWrapper
                                            showSkeleton={datasetInfoIsPending}
                                            skeletonClassName="w-20 h-4"
                                        >
                                            <span
                                                className="text-dark text-wrap"
                                                title={datasetInfo?.name}
                                            >
                                                {datasetInfoIsError
                                                    ? "N/A"
                                                    : truncateString(datasetInfo?.name, 40)}{" "}
                                            </span>
                                        </SkeletonWrapper>
                                    </p>

                                    <p className="text-gray flex items-center gap-x-1 text-nowrap flex-wrap">
                                        Zoom Levels:{" "}
                                        <SkeletonWrapper
                                            showSkeleton={trainingDetailsIsPending}
                                            skeletonClassName="w-20 h-4"
                                        >
                                            <span className="text-dark">
                                                {trainingDetailsError
                                                    ? "N/A"
                                                    : trainingDetails?.zoom_level?.join(", ")}{" "}
                                            </span>
                                        </SkeletonWrapper>
                                    </p>

                                    <p className="text-gray">
                                        Accuracy:{" "}
                                        <span className="text-dark">
                                            {roundNumber(
                                                model?.accuracy ?? (data?.accuracy as number),
                                                2,
                                            )}
                                            %
                                        </span>
                                    </p>
                                    <p className="text-gray">
                                        Base Model:{" "}
                                        <span className="text-dark">
                                            {model?.base_model ?? data?.base_model}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </SkeletonWrapper>
            }
        </Popup>
    );
};

export default ModelDetailsPopUp;
