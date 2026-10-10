import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { LocationSearchIcon } from "@/components/ui/icons/location-search-icon";
import { MapPlayIcon } from "@/components/ui/icons/map-play-icon";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { ButtonVariant, TryFairMapOutputType } from "@/enums";
import { getImageryTileJSONUrl } from "@/features/try-fair/api/hot-imagery";
import { useOAMItem } from "@/features/try-fair/hooks/use-oam-item";
import { OUTPUT_TYPES } from "@/features/try-fair/utils/common";

/** Output types available in the map-request result view (choropleth excluded). */
const MAP_REQUEST_OUTPUT_TYPES = OUTPUT_TYPES.filter(
  ({ type }) => type !== TryFairMapOutputType.CLUSTER,
);
import { MapRequestResultMap } from "@/features/user-profile/components/map-requests/map-request-result-map";
import { useGetSinglePrediction } from "@/features/user-profile/hooks/use-predictions";
import { Spinner } from "@/components/ui/spinner";
import { MobileDrawer } from "@/components/ui/drawer";
import useScreenSize from "@/hooks/use-screen-size";
import { BBOX, TOfflinePrediction } from "@/types";
import { cn, getGeoJSONFeatureBounds } from "@/utils";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const getPredictionName = (prediction: TOfflinePrediction): string =>
  prediction.description ||
  prediction.local_model_stac_id ||
  `Prediction #${prediction.id}`;

/** Info card shown over the map — styled like the Try fAIr sidebar. */
const ResultInfoCard = ({
  imageryName,
  featureMapped,
  outputType,
  onOutputTypeChange,
  zoom,
  params,
  className,
}: {
  imageryName: string;
  featureMapped: string;
  outputType: TryFairMapOutputType;
  onOutputTypeChange: (type: TryFairMapOutputType) => void;
  zoom: TOfflinePrediction["zoom"];
  params: TOfflinePrediction["params"];
  className?: string;
}) => (
  <div
    className={cn(
      "relative w-[300px] rounded-lg bg-white p-2 shadow-lg sm:px-3 sm:py-4 space-y-4 overflow-visible",
      className,
    )}
  >
    <div className="flex items-stretch overflow-hidden rounded-lg border border-[#687075] bg-gray-white">
      <div className="flex flex-1 min-w-0 items-center gap-2 pl-2.5 pr-2 py-2">
        <LocationSearchIcon className="size-5 shrink-0 hidden md:inline-block" />
        <p className="flex-1 min-w-0 truncate text-xs font-semibold capitalize leading-tight text-dark">
          {imageryName}
        </p>
      </div>

      <div className="my-2 w-px shrink-0 bg-gray-border" />

      <div className="flex items-center gap-2 p-2.5">
        <Button
          type="button"
          size="medium"
          rounded
          variant={ButtonVariant.TERTIARY}
          disabled
          className="flex items-center opacity-50 gap-2"
          fontSize="12px"
        >
          <MapPlayIcon className="size-4" />
          Map
        </Button>
      </div>
    </div>

    <div>
      <p className="text-dark text-xs mb-2">Feature Mapped</p>
      <div className="flex items-center gap-2 rounded-lg border border-gray-border bg-gray-white px-3 py-2.5 text-xs capitalize text-dark">
        {featureMapped}
      </div>
    </div>

    <div>
      <p className="text-dark text-xs mb-2">Map Output</p>
      <div className="flex items-center gap-2">
        {MAP_REQUEST_OUTPUT_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onOutputTypeChange(type)}
            className={cn(
              "flex-1 flex items-center justify-center py-2 rounded-lg",
              outputType === type
                ? "bg-secondary text-primary border-[#D63F4080] border"
                : "bg-off-white",
            )}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
    <details
      aria-label="Prediction configuration"
      className="border-t border-gray-border pt-4"
    >
      <summary className="cursor-pointer text-dark text-xs font-semibold">
        Prediction configuration
      </summary>
      <dl className="mt-3 space-y-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-grey">Zoom level</dt>
          <dd className="text-dark font-medium tabular-nums">{zoom}</dd>
        </div>
        {Object.entries(params ?? {}).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-3">
            <dt
              className="min-w-0 break-words capitalize text-grey"
              title={key}
            >
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="max-w-[45%] break-words text-right font-medium tabular-nums text-dark">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {Object.keys(params ?? {}).length === 0 && (
        <p className="mt-3 text-xs text-grey">No parameters recorded.</p>
      )}
    </details>
  </div>
);

export const MapRequestResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  // The row the user clicked seeds the query so it renders instantly; a direct
  // URL / refresh falls back to fetching the prediction by id.
  const initialPrediction = (
    location.state as { prediction?: TOfflinePrediction }
  )?.prediction;
  const {
    data: prediction,
    isPending,
    isError,
  } = useGetSinglePrediction(id, initialPrediction);

  const { isSmallViewport } = useScreenSize();

  const [outputType, setOutputType] = useState<TryFairMapOutputType>(
    TryFairMapOutputType.POLYGON,
  );

  // Fetch the OpenAerialMap item title for the sidebar name. The item id is
  // embedded in the imagery URL (…/items/{id}/tiles/…). Runs unconditionally.
  const oamItemId =
    prediction?.image_uri?.match(/\/items\/([^/?]+)/)?.[1] ?? null;
  const { item: oamItem } = useOAMItem(oamItemId);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Head title="Map Request Result" />
        <Spinner style={{ fontSize: "2rem" }} />
      </div>
    );
  }

  if (isError || !prediction) {
    return (
      <div className="app-padding flex min-h-[60vh] flex-col items-center justify-center gap-y-4 text-center">
        <Head title="Map Request Result" />
        <p className="text-grey text-body-2">
          Couldn't load this map request result.
        </p>
        <Link
          to={APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS}
          className="text-primary"
        >
          Go to Map Requests
        </Link>
      </div>
    );
  }

  const name = getPredictionName(prediction);
  const geojsonUrl = prediction.assets?.geojson;

  const imageryUrl = oamItemId
    ? getImageryTileJSONUrl(oamItemId)
    : (prediction.image_uri ?? "").replace("@1x", "");

  const bounds: BBOX | null =
    prediction.bbox ??
    (prediction.geometry
      ? getGeoJSONFeatureBounds({
          type: "Feature",
          geometry: prediction.geometry,
          properties: {},
        })
      : null);

  return (
    <>
      <Head title={`${name} — Result`} />
      {/* Same shell as the Try fAIr page. */}
      <div className="flex h-screen md:h-[92vh] flex-col fullscreen">
        <div className="flex-grow relative">
          {geojsonUrl ? (
            <MapRequestResultMap
              imageryUrl={imageryUrl}
              geojsonUrl={geojsonUrl}
              outputType={outputType}
              bounds={bounds}
              gridZoom={prediction.zoom}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-off-white">
              <p className="text-grey">No result available yet.</p>
            </div>
          )}

          {!isSmallViewport && (
            <div className="absolute top-4 left-4 z-10">
              <ResultInfoCard
                imageryName={oamItem?.title || "Custom Imagery"}
                featureMapped={prediction?.category ?? "-"}
                outputType={outputType}
                onOutputTypeChange={setOutputType}
                zoom={prediction.zoom}
                params={prediction.params}
                className="max-h-[calc(92vh-2rem)] overflow-y-auto"
              />
            </div>
          )}

          {isSmallViewport && (
            <div className="relative">
              <MobileDrawer
                open={isSmallViewport}
                dialogTitle="Map Request Result"
                snapPoints={[0.5, 0.7]}
                modal={false}
                showOverlay={false}
                handleOnly
              >
                <ResultInfoCard
                  imageryName={oamItem?.title || "Custom Imagery"}
                  featureMapped={prediction?.category ?? ""}
                  outputType={outputType}
                  onOutputTypeChange={setOutputType}
                  zoom={prediction.zoom}
                  params={prediction.params}
                  className="w-full shadow-none"
                />
              </MobileDrawer>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
