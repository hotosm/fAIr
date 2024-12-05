import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Head } from "@/components/seo";
import { Divider } from "@/components/ui/divider";
import { BBOX, TileJSON, TModelPredictions } from "@/types";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { BackButton } from "@/components/ui/button";
import { useGetTrainingDataset } from "@/features/models/hooks/use-dataset";
import {
  ModelAction,
  ModelHeader,
  ModelSettings,
  StartMappingMapComponent,
} from "@/features/start-mapping/components";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import {
  APPLICATION_ROUTES,
  extractTileJSONURL,
  PREDICTION_API_FILE_EXTENSIONS,
} from "@/utils";
import { APPLICATION_CONTENTS } from "@/contents";
import { useMap } from "@/app/providers/map-provider";
import { BASE_MODELS } from "@/enums";

export const SEARCH_PARAMS = {
  useJOSMQ: "useJOSMQ",
  confidenceLevel: "confidenceLevel",
  tolerance: "tolerance",
  area: "area",
};

export type TQueryParams = { [x: string]: string | number | boolean };

export const StartMappingPage = () => {
  const { modelId } = useParams();
  const { map, currentZoom } = useMap();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.useJOSMQ]: searchParams.get(SEARCH_PARAMS.useJOSMQ) || false,
    [SEARCH_PARAMS.confidenceLevel]:
      searchParams.get(SEARCH_PARAMS.confidenceLevel) || 90,
    [SEARCH_PARAMS.tolerance]: searchParams.get(SEARCH_PARAMS.tolerance) || 0.3,
    [SEARCH_PARAMS.area]: searchParams.get(SEARCH_PARAMS.area) || 4,
  };
  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

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

  const navigate = useNavigate();

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

  const [modelPredictions, setModelPredictions] = useState<TModelPredictions>({
    all: [],
    accepted: [],
    rejected: [],
  });

  const modelPredictionsExist = useMemo(
    () =>
      modelPredictions.accepted.length > 0 ||
      modelPredictions.rejected.length > 0 ||
      modelPredictions.all.length > 0,
    [modelPredictions],
  );

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      setQuery((prevQuery) => ({
        ...prevQuery,
        ...newParams,
      }));
      const updatedParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });
      setSearchParams(updatedParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const bounds = map?.getBounds();

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
  const renderModelHeader = useMemo(() => {
    return (
      <ModelHeader
        data={data}
        trainingDatasetIsPending={trainingDatasetIsPending}
        modelPredictionsExist={modelPredictionsExist}
        trainingDatasetIsError={trainingDatasetIsError}
        modelPredictions={modelPredictions}
        trainingDataset={trainingDataset}
        oamTileJSON={oamTileJSON}
      />
    );
  }, [
    data,
    trainingDatasetIsPending,
    modelPredictionsExist,
    trainingDatasetIsError,
    modelPredictions,
    trainingDataset,
    oamTileJSON,
  ]);

  return (
    <>
      <Head title={APPLICATION_CONTENTS.START_MAPPING.pageTitle(data?.name)} />
      <BackButton />

      <div className="min-h-screen md:h-[90vh] flex mt-8 flex-col mb-20">
        <div>
          {renderModelHeader}
          <div className="hidden md:block w-full">
            <Divider />
          </div>
          <div className="flex justify-between items-center py-3 flex-wrap gap-y-6 ">
            <ModelSettings updateQuery={updateQuery} query={query} />
            <ModelAction
              modelPredictions={modelPredictions}
              setModelPredictions={setModelPredictions}
              trainingConfig={trainingConfig}
            />
          </div>
        </div>
        <div className="col-span-12 h-[70vh] md:h-full border-8 border-off-white flex-grow fullscreen md:no-fullscreen">
          <StartMappingMapComponent
            trainingDataset={trainingDataset}
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            trainingConfig={trainingConfig}
            oamTileJSONIsError={oamTileJSONIsError}
            oamTileJSON={oamTileJSON as TileJSON}
            oamTileJSONError={oamTileJSONError}
            modelPredictionsExist={modelPredictionsExist}
          />
        </div>
      </div>
    </>
  );
};
