import { Legend } from "@/features/start-mapping/components";
import { AgreementStatus } from "@/enums/mapswipe";
import { MAP_CONTENT } from "@/constants";
import { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import { MAPSWIPE_AGREEMENT_FILL_COLORS } from "@/config";

const agreementLegendItems: (LegendItem & { status: AgreementStatus })[] = [
  {
    status: AgreementStatus.FULL,
    label: MAP_CONTENT.agreementLegend.fullAgreement,
    fillColor: MAPSWIPE_AGREEMENT_FILL_COLORS.green,
    fillOpacity: 0.3,
  },
  {
    status: AgreementStatus.PARTIAL,
    label: MAP_CONTENT.agreementLegend.partialAgreement,
    fillColor: MAPSWIPE_AGREEMENT_FILL_COLORS.purple,
    fillOpacity: 0.3,
  },
  {
    status: AgreementStatus.NONE,
    label: MAP_CONTENT.agreementLegend.noAgreement,
    fillColor: MAPSWIPE_AGREEMENT_FILL_COLORS.red,
    fillOpacity: 0.3,
  },
];

export const AgreementLegend = () => {
  return <Legend title="Agreement" items={agreementLegendItems} />;
};
