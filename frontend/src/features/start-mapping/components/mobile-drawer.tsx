import { MobileDrawer } from "@/components/ui/drawer"
import { MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION } from "@/utils"
import ModelAction from "./model-action"
import { TModelPredictionsConfig } from "../api/get-model-predictions";
import { TModelPredictions } from "@/types";
import { Map } from "maplibre-gl";
import { ModelDetailsButton } from "./model-details-button";


export const StartMappingMobileDrawer = (
    { isOpen, disablePrediction, trainingConfig, setModelPredictions, map, modelPredictions, showModelDetails, setShowModelDetails }:
        {
            isOpen: boolean,
            disablePrediction: boolean,
            trainingConfig: TModelPredictionsConfig;
            modelPredictions: TModelPredictions;
            setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
            map: Map | null;
            showModelDetails: boolean
            setShowModelDetails: (x: boolean) => void
        }) => {

    return (
        <MobileDrawer open={isOpen}>
            {disablePrediction && <p className="text-center italic text-body-3 text-primary w-full">{MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}</p>}
            <div className="flex items-center justify-between my-4">
                <div className="w-full basis-5/6">
                    <ModelAction
                        trainingConfig={trainingConfig}
                        setModelPredictions={setModelPredictions}
                        map={map}
                        disablePrediction={disablePrediction}
                        modelPredictions={modelPredictions}
                    />
                </div>
                <div className="p-1.5 icon-interaction">
                    <ModelDetailsButton onClick={() => setShowModelDetails(!showModelDetails)} showModelDetails={showModelDetails} />
                </div>
            </div>
        </MobileDrawer>
    )
}