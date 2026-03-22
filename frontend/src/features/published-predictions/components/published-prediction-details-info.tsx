import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { formatDate, formatNumber } from "@/utils";
import { SlDropdown } from "@shoelace-style/shoelace";
import { MutableRefObject, ReactNode } from "react";

export const PublishedPredictionDetailsInfo = ({
  prediction,
  modelUsed,
  createdBy,
  dropdownRef,
  placement = DropdownPlacement.BOTTOM_END,
  triggerComponent,
}: {
  prediction: TOfflinePrediction;
  modelUsed: string;
  createdBy: string;
  dropdownRef?: MutableRefObject<SlDropdown | null>;
  placement?: DropdownPlacement;
  triggerComponent?: ReactNode;
}) => {
  const featureCount = prediction.result?.count ?? 0;

  const publishedDate = prediction.published_at
    ? formatDate(prediction.published_at)
    : "-";
  return (
    <DropDown
      // @ts-ignore
      ref={dropdownRef}
      disableCheveronIcon
      placement={placement}
      triggerComponent={triggerComponent}
      className="text-right"
      distance={10}
    >
      <div className="flex flex-col gap-2 bg-white p-4 min-w-48">
        <span className="text-body-3 text-dark flex items-center gap-x-2 justify-between text-nowrap">
          Date Published: <span className="font-semibold">{publishedDate}</span>
        </span>
        <span className="text-body-3 text-dark flex items-center gap-x-2 justify-between text-nowrap">
          Created by: <span className="font-semibold">{createdBy}</span>
        </span>
        <span className="text-body-3 text-dark flex items-center gap-x-2 justify-between text-nowrap">
          Prediction Count:{" "}
          <span className="font-semibold">{formatNumber(featureCount)}</span>
        </span>
        <span className="text-body-3 text-dark flex items-center gap-x-2 justify-between text-nowrap">
          Model Used: <span className="font-semibold">{modelUsed}</span>
        </span>
      </div>
    </DropDown>
  );
};
