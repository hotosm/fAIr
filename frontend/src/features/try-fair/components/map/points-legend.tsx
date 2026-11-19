import { Legend } from "@/features/start-mapping/components";
import { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import {
  buildClassLegendItems,
  PredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";

type Props = {
  predictions: GeoJSON.FeatureCollection | null;
  classStyle?: PredictionClassStyle | null;
};

const POINT_COLOR = "#A147D8";

export const TryFairPointsLegend = ({ predictions, classStyle }: Props) => {
  if (!predictions) return null;
  const totalCount = predictions.features.length;

  const items: LegendItem[] =
    classStyle?.colored && totalCount > 0
      ? buildClassLegendItems(classStyle, predictions, "circle", 1)
      : [
          {
            label: `${totalCount.toLocaleString()} feature${totalCount === 1 ? "" : "s"} detected`,
            fillColor: POINT_COLOR,
            fillOpacity: 1,
            shape: "circle",
          },
        ];

  if (!items.length) return null;

  return <Legend position="bottom-right" title="Legend" items={items} />;
};
