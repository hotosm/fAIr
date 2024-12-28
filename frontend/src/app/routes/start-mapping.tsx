import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Head } from "@/components/seo";
import { BBOX, Feature, TileJSON, TModelPredictions } from "@/types";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useGetTrainingDataset } from "@/features/models/hooks/use-dataset";
import {
  BrandLogoWithDropDown,
  Legend,
  StartMappingHeader,
  StartMappingMapComponent,
  StartMappingMobileDrawer,
} from "@/features/start-mapping/components";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import { APPLICATION_ROUTES } from "@/constants";
import {
  extractTileJSONURL,
  geoJSONDowloader,
  openInJOSM,
  showSuccessToast,
} from "@/utils";
import { BASE_MODELS } from "@/enums";
import {
  START_MAPPING_PAGE_CONTENT,
  TOAST_NOTIFICATIONS,
  PREDICTION_API_FILE_EXTENSIONS,
  REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
} from "@/constants";
import { useMapInstance } from "@/hooks/use-map-instance";
import useScreenSize from "@/hooks/use-screen-size";
import { ModelDetailsPopUp } from "@/features/models/components";
import { UserProfile } from "@/components/layout";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { FitToBounds, LayerControl, ZoomLevel } from "@/components/map";
import { LngLatBoundsLike } from "maplibre-gl";

export type TDownloadOptions = {
  name: string;
  value: string;
  onClick: () => void;
  showOnMobile: boolean;
}[];

export const SEARCH_PARAMS = {
  useJOSMQ: "useJOSMQ",
  confidenceLevel: "confidenceLevel",
  tolerance: "tolerance",
  area: "area",
};

export type TQueryParams = { [x: string]: string | number | boolean };

export const StartMappingPage = () => {
  const { modelId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { map, mapContainerRef, currentZoom } = useMapInstance();
  const { isSmallViewport } = useScreenSize();
  const navigate = useNavigate();
  const bounds = map?.getBounds();
  const [showModelDetailsPopup, setShowModelDetailsPopup] =
    useState<boolean>(false);
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

  const { isError, isPending, data, error } = useModelDetails(
    modelId as string,
    !!modelId,
  );

  const {
    data: trainingDataset,
    isPending: trainingDatasetIsPending,
    isError: trainingDatasetIsError,
  } = useGetTrainingDataset(data?.dataset as number, !isPending);

  const tileJSONURL = extractTileJSONURL(trainingDataset?.source_imagery ?? "");

  const {
    data: oamTileJSON,
    isError: oamTileJSONIsError,
    error: oamTileJSONError,
  } = useGetTMSTileJSON(tileJSONURL);

  useEffect(() => {
    if (isError) {
      navigate(APPLICATION_ROUTES.NOTFOUND, {
        state: {
          from: window.location.pathname,
          // @ts-expect-error: might not be typed
          error: error?.response?.data?.detail,
        },
      });
    }
  }, [isError, error, navigate]);

  const [query, setQuery] = useState<TQueryParams>(() => {
    return {
      [SEARCH_PARAMS.useJOSMQ]:
        searchParams.get(SEARCH_PARAMS.useJOSMQ) || false,
      [SEARCH_PARAMS.confidenceLevel]:
        searchParams.get(SEARCH_PARAMS.confidenceLevel) || 90,
      [SEARCH_PARAMS.tolerance]:
        searchParams.get(SEARCH_PARAMS.tolerance) || 0.3,
      [SEARCH_PARAMS.area]: searchParams.get(SEARCH_PARAMS.area) || 4,
    };
  });

  const [modelPredictions, setModelPredictions] = useState<TModelPredictions>({
    all: [],
    accepted: [],
    rejected: [],
  });

  const modelPredictionsExist =
    modelPredictions.accepted.length > 0 ||
    modelPredictions.rejected.length > 0 ||
    modelPredictions.all.length > 0;

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      // Merge the new query values
      setQuery((prev) => ({ ...prev, ...newParams }));

      // Update the URLSearchParams
      const updatedParams = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(newParams)) {
        if (value !== undefined && value !== null) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      }
      setSearchParams(updatedParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const trainingConfig = {
    tolerance: query[SEARCH_PARAMS.tolerance] as number,
    area_threshold: query[SEARCH_PARAMS.area] as number,
    use_josm_q: query[SEARCH_PARAMS.useJOSMQ] as boolean,
    confidence: query[SEARCH_PARAMS.confidenceLevel] as number,
    checkpoint: `/mnt/efsmount/data/trainings/dataset_${data?.dataset}/output/training_${data?.published_training}/checkpoint${PREDICTION_API_FILE_EXTENSIONS[data?.base_model as BASE_MODELS]}`,
    max_angle_change: 15,
    model_id: modelId as string,
    skew_tolerance: 15,
    source: trainingDataset?.source_imagery as string,
    zoom_level: currentZoom,
    bbox: [
      bounds?.getWest(),
      bounds?.getSouth(),
      bounds?.getEast(),
      bounds?.getNorth(),
    ] as BBOX,
  };

  const disablePrediction =
    currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  const popupAnchorId = "model-details";

  const mapLayers = [
    ...(modelPredictions.accepted.length > 0
      ? [
          {
            value:
              START_MAPPING_PAGE_CONTENT.map.controls.legendControl
                .acceptedPredictions,
            subLayers: [
              ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
              ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
            ],
          },
        ]
      : []),
    ...(modelPredictions.rejected.length > 0
      ? [
          {
            value:
              START_MAPPING_PAGE_CONTENT.map.controls.legendControl
                .rejectedPredictions,
            subLayers: [
              REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
              REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
            ],
          },
        ]
      : []),
    ...(modelPredictions.all.length > 0
      ? [
          {
            value:
              START_MAPPING_PAGE_CONTENT.map.controls.legendControl
                .predictionResults,
            subLayers: [
              ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
              ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
            ],
          },
        ]
      : []),
  ];

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

  const downloadOptions: TDownloadOptions = [
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options.allFeatures,
      value: START_MAPPING_PAGE_CONTENT.buttons.download.options.allFeatures,
      onClick: handleAllFeaturesDownload,
      showOnMobile: true,
    },
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options
        .acceptedFeatures,
      value:
        START_MAPPING_PAGE_CONTENT.buttons.download.options.acceptedFeatures,
      onClick: handleAcceptedFeaturesDownload,
      showOnMobile: true,
    },
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options
        .openAllFeaturesInJOSM,
      value:
        START_MAPPING_PAGE_CONTENT.buttons.download.options
          .openAllFeaturesInJOSM,
      onClick: handleAllFeaturesDownloadToJOSM,
      showOnMobile: false,
    },
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options
        .openAcceptedFeaturesInJOSM,
      value:
        START_MAPPING_PAGE_CONTENT.buttons.download.options
          .openAcceptedFeaturesInJOSM,
      onClick: handleAcceptedFeaturesDownloadToJOSM,
      showOnMobile: false,
    },
  ];

  const handleModelDetailsPopup = useCallback(() => {
    setShowModelDetailsPopup((prev) => !prev);
  }, [setShowModelDetailsPopup]);

  const clearPredictions = useCallback(() => {
    setModelPredictions({
      accepted: [],
      rejected: [],
      all: [],
    });
  }, [setModelPredictions]);

  return (
    <>
      <Head title={START_MAPPING_PAGE_CONTENT.pageTitle(data?.name)} />
      {/* Mobile dialog */}
      <div className="h-screen flex flex-col fullscreen">
        <StartMappingMobileDrawer
          isOpen={isSmallViewport}
          disablePrediction={disablePrediction}
          trainingConfig={trainingConfig}
          setModelPredictions={setModelPredictions}
          modelPredictions={modelPredictions}
          map={map}
          handleModelDetailsPopup={handleModelDetailsPopup}
          downloadOptions={downloadOptions}
          query={query}
          updateQuery={updateQuery}
          modelDetailsPopupIsActive={showModelDetailsPopup}
          clearPredictions={clearPredictions}
        />
        <div className="sticky top-0 bg-white z-10 px-4 xl:px-large py-1 hidden md:block">
          {/* Model Details Popup */}
          {data && (
            <ModelDetailsPopUp
              showPopup={showModelDetailsPopup}
              handlePopup={handleModelDetailsPopup}
              closeMobileDrawer={() => setShowModelDetailsPopup(false)}
              anchor={popupAnchorId}
              model={data}
              trainingDataset={trainingDataset}
              trainingDatasetIsPending={trainingDatasetIsPending}
              trainingDatasetIsError={trainingDatasetIsError}
            />
          )}
          {/* Web Header */}
          <StartMappingHeader
            data={data}
            trainingDatasetIsPending={trainingDatasetIsPending}
            modelPredictionsExist={modelPredictionsExist}
            trainingDatasetIsError={trainingDatasetIsError}
            modelPredictions={modelPredictions}
            query={query}
            updateQuery={updateQuery}
            trainingConfig={trainingConfig}
            setModelPredictions={setModelPredictions}
            map={map}
            disablePrediction={disablePrediction}
            popupAnchorId={popupAnchorId}
            modelDetailsPopupIsActive={showModelDetailsPopup}
            handleModelDetailsPopup={handleModelDetailsPopup}
            downloadOptions={downloadOptions}
            clearPredictions={clearPredictions}
          />
        </div>
        <div className="col-span-12 h-[70vh] md:h-full md:border-8 md:border-off-white flex-grow relative map-elements-z-index">
          {/* Mobile Header and Map Controls */}
          <div className="md:hidden">
            <div className="absolute top-4 right-4  z-[10]">
              <UserProfile hideFullName />
            </div>
            <div className="absolute top-1 left-4  z-[10]">
              <BrandLogoWithDropDown
                onClose={onDropdownHide}
                onShow={onDropdownShow}
                isOpened={dropdownIsOpened}
              />
            </div>
            <div className="absolute top-[10vh] right-4 z-[2] flex flex-col gap-y-4 items-end">
              <ZoomLevel currentZoom={currentZoom} />
              <LayerControl
                layers={mapLayers}
                map={map}
                openAerialMap
                basemaps
              />
            </div>
            <div className="absolute bottom-[30vh] flex flex-col gap-y-4 right-4 z-[1] items-end">
              <FitToBounds bounds={oamTileJSON?.bounds} map={map} />
              <div>{map && modelPredictionsExist && <Legend map={map} />}</div>
            </div>
          </div>
          {/* Map Component */}
          <StartMappingMapComponent
            trainingDataset={trainingDataset}
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            trainingConfig={trainingConfig}
            oamTileJSONIsError={oamTileJSONIsError}
            oamTileJSON={oamTileJSON as TileJSON}
            oamTileJSONError={oamTileJSONError}
            modelPredictionsExist={modelPredictionsExist}
            mapContainerRef={mapContainerRef}
            map={map}
            currentZoom={currentZoom}
            layers={mapLayers}
            tmsBounds={oamTileJSON?.bounds as LngLatBoundsLike}
          />
        </div>
      </div>
    </>
  );
};
