import { Legend } from "@/features/start-mapping/components";
import { LegendItem } from "@/features/start-mapping/components/map/legend-control";

type Props = {
  totalCount: number;
};

const POINT_COLOR = "#A147D8";

export const TryFairPointsLegend = ({ totalCount }: Props) => {
  if (totalCount === 0) return null;

  const items: LegendItem[] = [
    {
      label: `${totalCount.toLocaleString()} objects detected`,
      fillColor: POINT_COLOR,
      fillOpacity: 1,
      shape: "circle",
    },
  ];

  return <Legend position="bottom-right" title="Legend" items={items} />;
};
