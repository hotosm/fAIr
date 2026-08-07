import { Badge } from "@/components/ui/badge";
import { DropDown } from "@/components/ui/dropdown";
import { InfoIcon } from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import { TPredictionsConfig } from "@/types";
import { SlDropdown } from "@shoelace-style/shoelace";
import { MutableRefObject } from "react";

export const OfflinePredictionsSettingsInfo = ({
  // predictionConfig,
  dropdownRef,
  disableSettingsInfoIcon,
  placement = DropdownPlacement.BOTTOM_END,
}: {
  predictionConfig: TPredictionsConfig;
  dropdownRef?: MutableRefObject<SlDropdown | null>;
  disableSettingsInfoIcon?: boolean;
  placement?: DropdownPlacement;
}) => {
  return (
    <DropDown
      // @ts-ignore
      ref={dropdownRef}
      disableCheveronIcon
      placement={placement}
      triggerComponent={
        !disableSettingsInfoIcon ? (
          <Badge
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="rounded-lg px-2 items-center flex"
          >
            <InfoIcon className="icon" />
          </Badge>
        ) : null
      }
      className="text-right"
      distance={10}
    >
      <div className="flex flex-col gap-2 bg-white p-4 min-w-48">
        <p className="font-bold text-body-3  text-dark text-start">Settings</p>
        {/* {Object.entries(predictionConfig)
          .filter(
            ([key]) =>
              !["checkpoint", "source", "model_id", "bbox"].includes(key),
          )
          .map(([key, value]) => (
            <span
              key={key}
              className="text-body-3 text-dark flex items-center gap-x-2 justify-between text-nowrap"
            >
              {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:{" "}
              <span className="font-semibold">
                {typeof value === "boolean"
                  ? value
                    ? "True"
                    : "False"
                  : String(value)}
              </span>
            </span>
          ))} */}
      </div>
    </DropDown>
  );
};
