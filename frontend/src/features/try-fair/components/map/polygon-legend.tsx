import { Legend } from "@/features/start-mapping/components";
import type { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import {
  buildClassLegendItems,
  DEFAULT_PREDICTION_COLOR,
  PredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";

type Props = {
  predictions: GeoJSON.FeatureCollection | null;
  classStyle?: PredictionClassStyle | null;
};

const FILL_OPACITY = 0.3;

export const TryFairPolygonLegend = ({ predictions, classStyle }: Props) => {
  const totalCount = predictions?.features.length ?? 0;
  if (!predictions || totalCount === 0) return null;

  const items: LegendItem[] = classStyle
    ? buildClassLegendItems(classStyle, predictions, "square", FILL_OPACITY)
    : [
        {
          label: `${totalCount.toLocaleString()} feature${totalCount === 1 ? "" : "s"} detected`,
          fillColor: DEFAULT_PREDICTION_COLOR,
          fillOpacity: FILL_OPACITY,
        },
      ];

  return <Legend position="bottom-right" title="Legend" items={items} />;
};
