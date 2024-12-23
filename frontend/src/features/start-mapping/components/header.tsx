import { BackButton, ButtonWithIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon, TagsInfoIcon } from "@/components/ui/icons";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { TOAST_NOTIFICATIONS } from "@/constants";
import { ModelDetailsPopUp } from "@/features/models/components";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import {
  Feature,
  TileJSON,
  TModel,
  TModelPredictions,
  TTrainingDataset,
} from "@/types";
import {
  APPLICATION_ROUTES,
  geoJSONDowloader,
  openInJOSM,
  showSuccessToast,
  truncateString,
} from "@/utils";
import { useCallback, useState } from "react";
import ModelSettings from "./model-settings";
import { TQueryParams } from "@/app/routes/start-mapping";
import ModelAction from "./model-action";
import { TModelPredictionsConfig } from "../api/get-model-predictions";
import { SHOELACE_SIZES } from "@/enums";
import { NavLogo, UserProfile } from "@/components/layout";
import { useNavigate } from "react-router-dom";
import { startMappingPageContent } from "@/constants";
import { Map } from "maplibre-gl";

const StartMappingHeader = ({
  data,
  modelPredictions,
  oamTileJSON,
  trainingDataset,
  trainingDatasetIsError,
  modelPredictionsExist,
  trainingDatasetIsPending,
  query,
  updateQuery,
  trainingConfig,
  setModelPredictions,
  currentZoom,
  map,
}: {
  modelPredictionsExist: boolean;
  trainingDatasetIsPending: boolean;
  trainingDatasetIsError: boolean;
  data: TModel;
  modelPredictions: TModelPredictions;
  trainingDataset?: TTrainingDataset;
  oamTileJSON?: TileJSON;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  trainingConfig: TModelPredictionsConfig;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
  currentZoom: number;
  map: Map | null;
}) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();

  const {
    onDropdownHide: onFAIRLogoDropdownHide,
    onDropdownShow: onFAIRLogoDropdownShow,
    dropdownIsOpened: FAIRLogoDropdownIsOpened,
  } = useDropdownMenu();

  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);

  const popupAnchorId = "model-details";

  const handleAllFeaturesDownload = useCallback(async () => {
    geoJSONDowloader(
      {
        type: "FeatureCollection",
        features: [
          ...modelPredictions.accepted,
          ...modelPredictions.rejected,
          ...modelPredictions.all,
        ],
      },
      `all_predictions_${data.dataset}`,
    );
    showSuccessToast(TOAST_NOTIFICATIONS.startMapping.fileDownloadSuccess);
  }, [modelPredictions]);

  const handleAcceptedFeaturesDownload = useCallback(async () => {
    geoJSONDowloader(
      { type: "FeatureCollection", features: modelPredictions.accepted },
      `accepted_predictions_${data.dataset}`,
    );
    showSuccessToast(TOAST_NOTIFICATIONS.startMapping.fileDownloadSuccess);
  }, [modelPredictions]);

  const handleFeaturesDownloadToJOSM = useCallback(
    (features: Feature[]) => {
      if (!map || !oamTileJSON?.name || !trainingDataset?.source_imagery)
        return;
      openInJOSM(
        oamTileJSON.name,
        trainingDataset.source_imagery,
        features,
        true,
      );
    },
    [map, oamTileJSON, trainingDataset],
  );

  const handleAllFeaturesDownloadToJOSM = useCallback(() => {
    handleFeaturesDownloadToJOSM(modelPredictions.all);
  }, [handleFeaturesDownloadToJOSM, modelPredictions.all]);

  const handleAcceptedFeaturesDownloadToJOSM = useCallback(() => {
    handleFeaturesDownloadToJOSM(modelPredictions.accepted);
  }, [handleFeaturesDownloadToJOSM, modelPredictions.accepted]);

  const downloadButtonDropdownOptions = [
    {
      name: startMappingPageContent.buttons.download.options.allFeatures,
      value: startMappingPageContent.buttons.download.options.allFeatures,
      onClick: handleAllFeaturesDownload,
    },
    {
      name: startMappingPageContent.buttons.download.options.acceptedFeatures,
      value: startMappingPageContent.buttons.download.options.acceptedFeatures,
      onClick: handleAcceptedFeaturesDownload,
    },
    {
      name: startMappingPageContent.buttons.download.options
        .openAllFeaturesInJOSM,
      value:
        startMappingPageContent.buttons.download.options.openAllFeaturesInJOSM,
      onClick: handleAllFeaturesDownloadToJOSM,
    },
    {
      name: startMappingPageContent.buttons.download.options
        .openAcceptedFeaturesInJOSM,
      value:
        startMappingPageContent.buttons.download.options
          .openAcceptedFeaturesInJOSM,
      onClick: handleAcceptedFeaturesDownloadToJOSM,
    },
  ];
  const navigate = useNavigate();

  return (
    <SkeletonWrapper showSkeleton={trainingDatasetIsPending}>
      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-2 ">
        <div className="flex items-center gap-x-4">
          <DropDown
            placement="top-end"
            dropdownIsOpened={FAIRLogoDropdownIsOpened}
            onDropdownHide={onFAIRLogoDropdownHide}
            onDropdownShow={onFAIRLogoDropdownShow}
            triggerComponent={
              <NavLogo onClick={() => null} width={"70px"} height={"50px"} />
            }
          >
            <div className="bg-white flex flex-col gap-4 w-40 p-4 rounded-md">
              <BackButton className="text-body-3" />
              <Divider />
              <button
                onClick={() => navigate(APPLICATION_ROUTES.MODELS)}
                className="text-left text-body-3 hover:bg-secondary p-2"
              >
                Explore Models
              </button>
              <button
                onClick={() => navigate(APPLICATION_ROUTES.HOMEPAGE)}
                className="text-left  text-body-3  hover:bg-secondary p-2"
              >
                Home
              </button>
            </div>
          </DropDown>
          <div className="flex flex-col md:flex-row md:items-center gap-x-2 z-10">
            <p title={data?.name} className="text-dark text-title-2base">
              {data?.name ? truncateString(data?.name, 35) : "N/A"}
            </p>
            <ModelDetailsPopUp
              showPopup={showModelDetails}
              closePopup={() => setShowModelDetails(false)}
              anchor={popupAnchorId}
              model={data}
              trainingDataset={trainingDataset}
              trainingDatasetIsPending={trainingDatasetIsPending}
              trainingDatasetIsError={trainingDatasetIsError}
            />
            <button
              id={popupAnchorId}
              className="text-gray text-body-2 flex items-center"
              onClick={() => setShowModelDetails(!showModelDetails)}
            >
              <TagsInfoIcon className="icon" />
            </button>
          </div>
        </div>
        <div className="flex flex-row items-center gap-x-2">
          <ModelSettings updateQuery={updateQuery} query={query} />
          <div className="flex flex-row items-center gap-y-3">
            <p className="text-dark text-body-3">
              {startMappingPageContent.mapData.title} -{" "}
              {startMappingPageContent.mapData.accepted}:{" "}
              {modelPredictions.accepted.length}{" "}
              {startMappingPageContent.mapData.rejected}:{" "}
              {modelPredictions.rejected.length}{" "}
            </p>
            <DropDown
              placement="top-end"
              disableCheveronIcon
              dropdownIsOpened={dropdownIsOpened}
              onDropdownHide={onDropdownHide}
              onDropdownShow={onDropdownShow}
              menuItems={downloadButtonDropdownOptions}
              triggerComponent={
                <ButtonWithIcon
                  uppercase={false}
                  onClick={dropdownIsOpened ? onDropdownHide : onDropdownShow}
                  suffixIcon={ChevronDownIcon}
                  label={startMappingPageContent.buttons.download.label}
                  size={SHOELACE_SIZES.MEDIUM}
                  variant="secondary"
                  disabled={!modelPredictionsExist}
                  iconClassName={
                    dropdownIsOpened ? "rotate-180 transition-all" : ""
                  }
                />
              }
            />
          </div>
          <ModelAction
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            trainingConfig={trainingConfig}
            map={map}
            currentZoom={currentZoom}
          />

          <UserProfile hideFullName />
        </div>
      </div>
    </SkeletonWrapper>
  );
};

export default StartMappingHeader;
