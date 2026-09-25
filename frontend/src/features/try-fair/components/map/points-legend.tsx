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
  const totalCount = predictions?.features.length ?? 0;
  if (!predictions || totalCount === 0) return null;

  const items: LegendItem[] = classStyle
    ? buildClassLegendItems(classStyle, predictions, "circle", 1)
    : [
        {
          label: `${totalCount.toLocaleString()} feature${totalCount === 1 ? "" : "s"} detected`,
          fillColor: POINT_COLOR,
          fillOpacity: 1,
          shape: "circle",
        },
      ];

  return <Legend position="bottom-right" title="Legend" items={items} />;
};
