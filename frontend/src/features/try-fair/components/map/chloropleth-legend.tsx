import { Legend } from "@/features/start-mapping/components";
import { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import { ChoroplethBucket } from "@/features/try-fair/utils/helpers";

type Props = {
  buckets: ChoroplethBucket[] | null;
  title?: string;
  fillOpacity?: number;
};

export const TryFairChoroplethLegend = ({
  buckets,
  title = "Legend",
  fillOpacity = 0.75,
}: Props) => {
  if (!buckets || buckets.length === 0) return null;

  const items: LegendItem[] = buckets.map((item) => ({
    label: item.label,
    fillColor: item.color,
    fillOpacity,
  }));

  return <Legend position="bottom-right" title={title} items={items} />;
};
