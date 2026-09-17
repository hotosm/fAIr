import { Legend } from "@/features/start-mapping/components";
import type { LegendItem } from "@/features/start-mapping/components/map/legend-control";

type Props = {
  totalCount: number;
};

export const TryFairPolygonLegend = ({ totalCount }: Props) => {
  if (totalCount === 0) return null;

  const items: LegendItem[] = [
    {
      label: `${totalCount.toLocaleString()} features detected`,
      fillColor: "#A243DC",
      fillOpacity: 0.3,
    },
  ];

  return <Legend position="bottom-right" title="Legend" items={items} />;
};
