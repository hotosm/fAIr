import { useMap } from "@/app/providers/map-provider";
import { Head } from "@/components/seo";
import { BackButton, Button, ButtonWithIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { FormLabel, Input, Select, Switch } from "@/components/ui/form";
import { ChevronDownIcon, TagsInfoIcon } from "@/components/ui/icons";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { BASE_MODELS, INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import { ModelDetailsPopUp } from "@/features/models/components";
import { useGetTrainingDataset } from "@/features/models/hooks/use-dataset";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { StartMappingMapComponent } from "@/features/start-mapping/components";
import { useGetModelPredictions } from "@/features/start-mapping/hooks/use-model-predictions";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import booleanIntersects from "@turf/boolean-intersects"
import { BBOX, TileJSON, TModelPredictions } from "@/types";
import {
  APPLICATION_ROUTES,
  extractTileJSONURL,
  geoJSONDowloader,
  MIN_ZOOM_LEVEL_FOR_PREDICTION,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
  openInJOSM,
  roundNumber,
  showErrorToast,
  showSuccessToast,
  truncateString,
  uuid4,
} from "@/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";

const SEARCH_PARAMS = {
  useJOSMQ: "useJOSMQ",
  confidenceLevel: "confidenceLevel",
  tolerance: "tolerance",
  area: "area",
};

const confidenceLevels = [
  {
    name: "25%",
    value: 25,
  },
  {
    name: "50%",
    value: 50,
  },
  {
    name: "75%",
    value: 75,
  },
  {
    name: "90%",
    value: 90,
  },
];

export const StartMappingPage = () => {
  const { modelId } = useParams();

  const { isError, isPending, data, error } = useModelDetails(
    modelId as string,
    modelId !== undefined,
  );

  const {
    data: trainingDataset,
    isPending: trainingDatasetIsPending,
    isError: trainingDatasetIsError,
  } = useGetTrainingDataset(data?.dataset as number, !isPending);

  const tileJSONURL = extractTileJSONURL(trainingDataset?.source_imagery ?? "");

  const { data: oamTileJSON, isError: oamTileJSONIsError, error: oamTileJSONError } = useGetTMSTileJSON(tileJSONURL);

  const navigate = useNavigate();
  const { currentZoom, map } = useMap();

  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.useJOSMQ]: searchParams.get(SEARCH_PARAMS.useJOSMQ) || false,
    [SEARCH_PARAMS.confidenceLevel]:
      searchParams.get(SEARCH_PARAMS.confidenceLevel) || 90,
    [SEARCH_PARAMS.tolerance]: searchParams.get(SEARCH_PARAMS.tolerance) || 0.3,
    [SEARCH_PARAMS.area]: searchParams.get(SEARCH_PARAMS.area) || 4,
  };

  type TQueryParams = typeof defaultQueries;

  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);

  useEffect(() => {
    if (isError) {
      navigate(APPLICATION_ROUTES.NOTFOUND, {
        state: {
          from: window.location.pathname,
          //@ts-expect-error bad type definition
          error: error?.response?.data?.detail,
        },
      });
    }
  }, [isError, error, navigate]);

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      setQuery((prevQuery) => ({
        ...prevQuery,
        ...newParams,
      }));
      const updatedParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });
      setSearchParams(updatedParams);
    },
    [searchParams, setSearchParams],
  );
  const disableButtons = currentZoom < MIN_ZOOM_LEVEL_FOR_PREDICTION;

  const popupAnchorId = "model-details";

  const [modelPredictions, setModelPredictions] = useState<TModelPredictions>({
    all: [],
    accepted: [],
    rejected: [],
  });

  const handleAllFeaturesDownload = useCallback(async () => {
    geoJSONDowloader({ type: 'FeatureCollection', features: [...modelPredictions.accepted, ...modelPredictions.rejected, ...modelPredictions.all] }, `all_predictions_${data.dataset}`);
    showSuccessToast('Download successful.')
  }, [modelPredictions]);

  const handleAcceptedFeaturesDownload = useCallback(async () => {
    geoJSONDowloader({ type: 'FeatureCollection', features: modelPredictions.accepted }, `accepted_predictions_${data.dataset}`);
    showSuccessToast('Download successful.')
  }, [modelPredictions]);

  const handleOpenInJOSM = useCallback(() => {
    openInJOSM(oamTileJSON?.name as string, trainingDataset?.source_imagery as string, oamTileJSON?.bounds as BBOX)
  }, [oamTileJSON, trainingDataset])

  const downloadButtonDropdownOptions = [
    {
      name: "All Features as GeoJSON",
      value: "All Features as GeoJSON",
      onClick: handleAllFeaturesDownload
    },
    {
      name: "Accepted Features Only",
      value: "Accepted Features Only",
      onClick: handleAcceptedFeaturesDownload
    },
    {
      name: "Open in JSOM",
      value: "Open in JOSM",
      onClick: handleOpenInJOSM
    },
  ];

  const modelPredictionMutation = useGetModelPredictions({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast("Model predictions retrieved successfully.");

        const existingFeatures = [
          ...modelPredictions.all,
          ...modelPredictions.accepted,
          ...modelPredictions.rejected,
        ];

        // Filter out new features that intersect with any existing feature
        const nonIntersectingFeatures = data.features ? data.features.filter((newFeature) => {
          return !existingFeatures.some((existingFeature) => {
            return booleanIntersects(newFeature, existingFeature);
          });
        }) : []
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

  const trainingConfig = useMemo(() => {
    const bounds = map?.getBounds();
    return (
      {
        tolerance: query[SEARCH_PARAMS.tolerance] as number,
        area_threshold: query[SEARCH_PARAMS.area] as number,
        use_josm_q: query[SEARCH_PARAMS.useJOSMQ] as boolean,
        confidence: query[SEARCH_PARAMS.confidenceLevel] as number,
        checkpoint: `/mnt/efsmount/data/trainings/dataset_${data?.dataset}/output/training_${data?.published_training}/checkpoint.${data?.base_model === BASE_MODELS.RAMP ? "tflite" : "pt"}`,
        max_angle_change: 15,
        model_id: modelId as string,
        skew_tolerance: 15,
        source: trainingDataset?.source_imagery as string,
        zoom_level: roundNumber(currentZoom, 0),
        bbox: [
          bounds?.getWest(),
          bounds?.getSouth(),
          bounds?.getEast(),
          bounds?.getNorth(),
        ] as BBOX,
      }
    )
  }, [query, map, currentZoom, trainingDataset, modelId, data])

  const handlePrediction = useCallback(async () => {
    if (!map) return;
    await modelPredictionMutation.mutateAsync(trainingConfig);
  }, [trainingConfig]);

  return (
    <SkeletonWrapper showSkeleton={isPending}>
      <Head title="Start Mapping" />
      <BackButton />
      <div className="h-[90vh] flex flex-col mt-4 mb-20">
        <div className="sticky top-0 z-[10] bg-white">
          <div className="flex items-center justify-between py-3 flex-wrap gap-y-2">
            <div className="flex items-center gap-x-6 z-10">
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
                Model Details <TagsInfoIcon className="icon" />
              </button>
            </div>
            <div className="flex items-center gap-x-6">
              <p className="text-dark text-body-3">
                Map Data - Accepted: {modelPredictions.accepted.length}{" "}
                Rejected: {modelPredictions.rejected.length}{" "}
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
                    disabled={disableButtons}
                    onClick={dropdownIsOpened ? onDropdownHide : onDropdownShow}
                    suffixIcon={ChevronDownIcon}
                    label="download"
                    variant="dark"
                    iconClassName={
                      dropdownIsOpened ? "rotate-180 transition-all" : ""
                    }
                  />
                }
              />
            </div>
          </div>
          <Divider />
          <div className="flex justify-between items-center py-3 flex-wrap gap-y-2">
            <div className="flex items-center gap-x-4 justify-between flex-wrap gap-y-2">
              <p>Use JOSM Q</p>
              <Switch
                checked={query[SEARCH_PARAMS.useJOSMQ] as boolean}
                handleSwitchChange={(event) => {
                  updateQuery({
                    [SEARCH_PARAMS.useJOSMQ]: event.target.checked,
                  });
                }}
              />
              <div className="flex justify-between items-center gap-x-3">
                <FormLabel
                  label="Confidence"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Select
                  className="w-28"
                  size={SHOELACE_SIZES.MEDIUM}
                  options={confidenceLevels}
                  defaultValue={query[SEARCH_PARAMS.confidenceLevel] as number}
                  handleChange={(event) => {
                    updateQuery({
                      [SEARCH_PARAMS.confidenceLevel]: Number(
                        event.target.value,
                      ),
                    });
                  }}
                />
              </div>
              <div className="flex justify-between items-center gap-x-3">
                <FormLabel
                  label="Tolerance"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Input
                  className="w-20"
                  size={SHOELACE_SIZES.MEDIUM}
                  value={query[SEARCH_PARAMS.tolerance] as number}
                  labelWithTooltip
                  type={INPUT_TYPES.NUMBER}
                  showBorder
                  handleInput={(event) =>
                    updateQuery({
                      [SEARCH_PARAMS.tolerance]: Number(event.target.value),
                    })
                  }
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="flex justify-between  items-center gap-x-3 ">
                <FormLabel
                  label="Area"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Input
                  className="w-20"
                  size={SHOELACE_SIZES.MEDIUM}
                  value={query[SEARCH_PARAMS.area] as number}
                  labelWithTooltip
                  type={INPUT_TYPES.NUMBER}
                  showBorder
                  handleInput={(event) =>
                    updateQuery({
                      [SEARCH_PARAMS.area]: Number(event.target.value),
                    })
                  }
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-x-4 w-fit flex-wrap md:flex-nowrap gap-y-2">
              {disableButtons && (
                <p className="text-primary text-sm text-nowrap italic">
                  {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
                </p>
              )}
              <Button
                disabled={disableButtons || modelPredictionMutation.isPending}
                onClick={handlePrediction}
              >
                {modelPredictionMutation.isPending
                  ? "Running..."
                  : "Run Prediction"}
              </Button>
            </div>
          </div>
        </div>
        <div className="col-span-12  w-full border-8 border-off-white flex-grow">
          <StartMappingMapComponent
            trainingDataset={trainingDataset}
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            trainingConfig={trainingConfig}
            oamTileJSONIsError={oamTileJSONIsError}
            oamTileJSON={oamTileJSON as TileJSON}
            oamTileJSONError={oamTileJSONError}
          />
        </div>
      </div>
    </SkeletonWrapper>
  );
};
