import useScreenSize from "@/hooks/use-screen-size";
import {
  APPLICATION_ROUTES,
  START_MAPPING_PAGE_CONTENT,
  TOAST_NOTIFICATIONS,
} from "@/constants";
import { FitToBounds, LayerControl, ZoomLevel } from "@/components/map";
import { Head } from "@/components/seo";
import { LngLatBoundsLike } from "maplibre-gl";
import { ModelDetailsPopUp } from "@/features/start-mapping/components";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UserProfile } from "@/components/layout";
import { Feature, TileJSON, TModelPredictions } from "@/types";
import {
  BrandLogoWithDropDown,
  Legend,
  StartMappingHeader,
  StartMappingMapComponent,
  StartMappingMobileDrawer,
} from "@/features/start-mapping/components";
import {
  extractTileJSONURL,
  geoJSONDowloader,
  openInJOSM,
  showSuccessToast,
} from "@/utils";
import {
  REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  HOT_FAIR_MODEL_PREDICTIONS_LOCAL_STORAGE_KEY,
} from "@/config";
import { useLocalStorage } from "@/hooks/use-storage";

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

  const [showModelDetailsPopup, setShowModelDetailsPopup] =
    useState<boolean>(false);
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

  const {
    isError,
    isPending: modelInfoRequestIspending,
    data: modelInfo,
    error,
  } = useModelDetails(modelId as string, !!modelId);

  const tileJSONURL = useMemo(
    () =>
      modelInfo?.dataset?.source_imagery
        ? extractTileJSONURL(modelInfo?.dataset?.source_imagery)
        : undefined,
    [modelInfo?.dataset?.source_imagery],
  );

  const { data: oamTileJSON, isError: oamTileJSONIsError } = useGetTMSTileJSON(
    tileJSONURL as string,
    !!tileJSONURL,
  );

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
        searchParams.get(SEARCH_PARAMS.tolerance) || 0.5,
      [SEARCH_PARAMS.area]: searchParams.get(SEARCH_PARAMS.area) || 4,
    };
  });
  const { setValue, getValue } = useLocalStorage();

  const emptyPredictionState = {
    accepted: [],
    rejected: [],
    all: [],
  };
  const [modelPredictions, setModelPredictions] = useState<TModelPredictions>(
    () => {
      const savedPredictions = getValue(
        HOT_FAIR_MODEL_PREDICTIONS_LOCAL_STORAGE_KEY(modelId as string),
      );
      return savedPredictions
        ? JSON.parse(savedPredictions)
        : emptyPredictionState;
    },
  );

  useEffect(() => {
    setValue(
      HOT_FAIR_MODEL_PREDICTIONS_LOCAL_STORAGE_KEY(modelId as string),
      JSON.stringify(modelPredictions),
    );
  }, [modelPredictions, modelId]);

  const modelPredictionsExist = useMemo(() => {
    return (
      modelPredictions.accepted.length > 0 ||
      modelPredictions.rejected.length > 0 ||
      modelPredictions.all.length > 0
    );
  }, [modelPredictions]);

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

  const disablePrediction =
    currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  const popupAnchorId = "model-details";

  const mapLayers = useMemo(
    () => [
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
    ],
    [modelPredictions],
  );

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
      `all_predictions_${modelInfo.dataset.id}`,
    );
    showSuccessToast(TOAST_NOTIFICATIONS.startMapping.fileDownloadSuccess);
  }, [modelPredictions, modelInfo]);

  const handleAcceptedFeaturesDownload = useCallback(async () => {
    geoJSONDowloader(
      { type: "FeatureCollection", features: modelPredictions.accepted },
      `accepted_predictions_${modelInfo.dataset.id}`,
    );
    showSuccessToast(TOAST_NOTIFICATIONS.startMapping.fileDownloadSuccess);
  }, [modelPredictions, modelInfo]);

  const handleFeaturesDownloadToJOSM = useCallback(
    (features: Feature[]) => {
      if (!map || !modelInfo?.dataset) return;
      openInJOSM(
        modelInfo.dataset.name,
        modelInfo.dataset.source_imagery,
        features,
        true,
      );
    },
    [map, modelInfo],
  );

  const handleAllFeaturesDownloadToJOSM = useCallback(() => {
    handleFeaturesDownloadToJOSM(modelPredictions.all);
  }, [handleFeaturesDownloadToJOSM, modelPredictions.all]);

  const handleAcceptedFeaturesDownloadToJOSM = useCallback(() => {
    handleFeaturesDownloadToJOSM(modelPredictions.accepted);
  }, [handleFeaturesDownloadToJOSM, modelPredictions.accepted]);

  const downloadOptions: TDownloadOptions = [
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options.allFeatures(
        isSmallViewport ? "All" : "Download all",
      ),
      value: START_MAPPING_PAGE_CONTENT.buttons.download.options.allFeatures(
        isSmallViewport ? "All" : "Download all",
      ),
      onClick: handleAllFeaturesDownload,
      showOnMobile: true,
    },
    {
      name: START_MAPPING_PAGE_CONTENT.buttons.download.options.acceptedFeatures(
        isSmallViewport ? "Accepted" : "Download accepted",
      ),
      value:
        START_MAPPING_PAGE_CONTENT.buttons.download.options.acceptedFeatures(
          isSmallViewport ? "Accepted" : "Download accepted",
        ),
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
    setModelPredictions(emptyPredictionState);
  }, [setModelPredictions]);

  return (
    <>
      <Head title={START_MAPPING_PAGE_CONTENT.pageTitle(modelInfo?.name)} />
      <div className="h-screen flex flex-col fullscreen">
        {/* Mobile dialog */}
        <StartMappingMobileDrawer
          isOpen={isSmallViewport}
          disablePrediction={disablePrediction}
          setModelPredictions={setModelPredictions}
          modelPredictions={modelPredictions}
          map={map}
          handleModelDetailsPopup={handleModelDetailsPopup}
          downloadOptions={downloadOptions}
          query={query}
          updateQuery={updateQuery}
          modelDetailsPopupIsActive={showModelDetailsPopup}
          clearPredictions={clearPredictions}
          currentZoom={currentZoom}
          modelInfo={modelInfo}
        />
        <div className="sticky top-0 bg-white z-10 px-4 xl:px-large py-1 hidden md:block">
          {/* Model Details Popup */}
          {showModelDetailsPopup && (
            <ModelDetailsPopUp
              showPopup={showModelDetailsPopup}
              handlePopup={handleModelDetailsPopup}
              closeMobileDrawer={() => setShowModelDetailsPopup(false)}
              anchor={popupAnchorId}
              modelInfo={modelInfo}
              modelInfoRequestIsPending={modelInfoRequestIspending}
              modelInfoRequestIsError={isError}
            />
          )}
          {/* Web Header */}
          <StartMappingHeader
            modelInfo={modelInfo}
            modelInfoRequestIsPending={modelInfoRequestIspending}
            modelPredictionsExist={modelPredictionsExist}
            modelInfoRequestIsError={isError}
            modelPredictions={modelPredictions}
            query={query}
            updateQuery={updateQuery}
            setModelPredictions={setModelPredictions}
            map={map}
            disablePrediction={disablePrediction}
            popupAnchorId={popupAnchorId}
            modelDetailsPopupIsActive={showModelDetailsPopup}
            handleModelDetailsPopup={handleModelDetailsPopup}
            downloadOptions={downloadOptions}
            clearPredictions={clearPredictions}
            currentZoom={currentZoom}
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
            trainingDataset={modelInfo?.dataset}
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            oamTileJSONIsError={oamTileJSONIsError}
            oamTileJSON={oamTileJSON as TileJSON}
            modelPredictionsExist={modelPredictionsExist}
            mapContainerRef={mapContainerRef}
            map={map}
            currentZoom={currentZoom}
            layers={mapLayers}
            tmsBounds={oamTileJSON?.bounds as LngLatBoundsLike}
            trainingId={modelInfo?.published_training}
            modelInfoRequestIsPending={modelInfoRequestIspending}
          />
        </div>
      </div>
    </>
  );
};
