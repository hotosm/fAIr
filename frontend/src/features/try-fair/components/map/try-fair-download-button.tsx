import { CloudDownloadIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { ToolTipPlacement } from "@/enums";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { cn } from "@/utils";
import { geoJSONDowloader } from "@/utils/geo/geo-utils";
import {
  buildChoropleth,
  toPointCollection,
} from "@/features/try-fair/utils/helpers";
import { APP_TOUR_IDS } from "@/constants/site-tour";

type TryFairDownloadButtonProps = {
  predictions: GeoJSON.FeatureCollection | null;
  outputType: TryFairMapOutputType;
  predictionBBox?: BBOX | null;
  predictionGridZoom?: number | null;
  className?: string;
};

const getDownloadData = (
  predictions: GeoJSON.FeatureCollection,
  outputType: TryFairMapOutputType,
  predictionBBox?: BBOX | null,
  predictionGridZoom?: number | null,
): GeoJSON.FeatureCollection => {
  if (outputType === TryFairMapOutputType.POINTS) {
    return toPointCollection(predictions);
  }
  if (outputType === TryFairMapOutputType.CLUSTER && predictionBBox) {
    return buildChoropleth(
      predictions,
      predictionBBox,
      predictionGridZoom ?? undefined,
    );
  }
  return predictions;
};

export const TryFairDownloadButton = ({
  predictions,
  outputType,
  predictionBBox,
  predictionGridZoom,
  className,
}: TryFairDownloadButtonProps) => {
  const hasPredictions = Boolean(predictions?.features?.length);

  const handleDownload = () => {
    if (!predictions) return;
    const exportData = getDownloadData(
      predictions,
      outputType,
      predictionBBox,
      predictionGridZoom,
    );
    geoJSONDowloader(
      exportData,
      `fair-predictions-${outputType.toLowerCase()}`,
    );
  };

  return (
    <ToolTip
      content={
        hasPredictions ? "Download predictions" : "Run predictions to download"
      }
      placement={ToolTipPlacement.BOTTOM}
    >
      <button
        type="button"
        id={APP_TOUR_IDS.TRY_FAIR_DOWNLOAD_PREDICTIONS_BUTTON}
        onClick={handleDownload}
        disabled={!hasPredictions}
        aria-label={
          hasPredictions
            ? "Download predictions"
            : "Run predictions to download"
        }
        className={cn(
          "size-8 p-0 bg-white rounded-[4px] border-0 flex items-center justify-center text-dark disabled:cursor-not-allowed",
          className,
        )}
      >
        <CloudDownloadIcon
          className={cn(
            "size-5",
            hasPredictions ? "text-dark" : "text-light-gray",
          )}
        />
      </button>
    </ToolTip>
  );
};
