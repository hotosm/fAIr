import { useMap } from "@/app/providers/map-provider";
import { ButtonWithIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon, TagsInfoIcon } from "@/components/ui/icons";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { APPLICATION_CONTENTS, TOAST_NOTIFICATIONS } from "@/contents";
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
  geoJSONDowloader,
  openInJOSM,
  showSuccessToast,
  truncateString,
} from "@/utils";
import { useCallback, useState } from "react";

const ModelHeader = ({
  data,
  modelPredictions,
  oamTileJSON,
  trainingDataset,
  trainingDatasetIsError,
  modelPredictionsExist,
  trainingDatasetIsPending,
}: {
  modelPredictionsExist: boolean;
  trainingDatasetIsPending: boolean;
  trainingDatasetIsError: boolean;
  data: TModel;
  modelPredictions: TModelPredictions;
  trainingDataset?: TTrainingDataset;
  oamTileJSON?: TileJSON;
}) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const { map } = useMap();
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
      const bounds = [
        ...map.getBounds().toArray()[0],
        ...map.getBounds().toArray()[1],
      ];
      openInJOSM(
        oamTileJSON.name,
        trainingDataset.source_imagery,
        //@ts-expect-error bad type definition
        bounds,
        features,
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
      name: APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
        .allFeatures,
      value:
        APPLICATION_CONTENTS.START_MAPPING.buttons.download.options.allFeatures,
      onClick: handleAllFeaturesDownload,
    },
    {
      name: APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
        .acceptedFeatures,
      value:
        APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
          .acceptedFeatures,
      onClick: handleAcceptedFeaturesDownload,
    },
    {
      name: APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
        .openAllFeaturesInJOSM,
      value:
        APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
          .openAllFeaturesInJOSM,
      onClick: handleAllFeaturesDownloadToJOSM,
    },
    {
      name: APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
        .openAcceptedFeaturesInJOSM,
      value:
        APPLICATION_CONTENTS.START_MAPPING.buttons.download.options
          .openAcceptedFeaturesInJOSM,
      onClick: handleAcceptedFeaturesDownloadToJOSM,
    },
  ];
  return (
    <SkeletonWrapper showSkeleton={trainingDatasetIsPending}>
      <div className="flex items-center justify-between flex-wrap py-3 gap-y-6 md:gap-y-2">
        <div className="flex flex-col md:flex-row md:items-center gap-y-3 md:gap-x-6 z-10">
          <p
            title={data?.name}
            className="text-dark font-semibold text-title-3"
          >
            {data?.name ? truncateString(data?.name, 40) : "N/A"}
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
            className="text-gray flex items-center gap-x-4 text-nowrap"
            onClick={() => setShowModelDetails(!showModelDetails)}
          >
            {APPLICATION_CONTENTS.START_MAPPING.modelDetails.label}{" "}
            <TagsInfoIcon className="icon" />
          </button>
        </div>
        <div className="block md:hidden w-full">
          <Divider />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-y-3 gap-x-6">
          <p className="text-dark text-body-3">
            {APPLICATION_CONTENTS.START_MAPPING.mapData.title} -{" "}
            {APPLICATION_CONTENTS.START_MAPPING.mapData.accepted}:{" "}
            {modelPredictions.accepted.length}{" "}
            {APPLICATION_CONTENTS.START_MAPPING.mapData.rejected}:{" "}
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
                onClick={dropdownIsOpened ? onDropdownHide : onDropdownShow}
                suffixIcon={ChevronDownIcon}
                label={
                  APPLICATION_CONTENTS.START_MAPPING.buttons.download.label
                }
                variant="dark"
                disabled={!modelPredictionsExist}
                iconClassName={
                  dropdownIsOpened ? "rotate-180 transition-all" : ""
                }
              />
            }
          />
        </div>
      </div>
    </SkeletonWrapper>
  );
};

export default ModelHeader;
