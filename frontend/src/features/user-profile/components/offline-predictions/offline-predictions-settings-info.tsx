import { Badge } from "@/components/ui/badge";
import { DropDown } from "@/components/ui/dropdown";
import { InfoIcon } from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import { TPredictionsConfig } from "@/types";
import { SlDropdown } from "@shoelace-style/shoelace";
import { RefObject } from "react";

export const OfflinePredictionsSettingsInfo = ({
  predictionConfig,
  dropdownRef,
  disableSettingsInfoIcon,
  placement = DropdownPlacement.BOTTOM_END,
}: {
  predictionConfig: TPredictionsConfig;
  dropdownRef?: RefObject<SlDropdown | null>;
  disableSettingsInfoIcon?: boolean;
  placement?: DropdownPlacement;
}) => {
  return (
    <DropDown
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
            className="flex items-center rounded-lg px-2"
          >
            <InfoIcon className="icon" />
          </Badge>
        ) : null
      }
      className="text-right"
      distance={10}
    >
      <div className="flex min-w-48 flex-col gap-2 bg-white p-4">
        <p className="text-start text-body-3  font-bold text-dark">Settings</p>
        {Object.entries(predictionConfig)
          .filter(
            ([key]) =>
              !["checkpoint", "source", "model_id", "bbox"].includes(key)
          )
          .map(([key, value]) => (
            <span
              key={key}
              className="flex items-center justify-between gap-x-2 text-nowrap text-body-3 text-dark"
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
          ))}
      </div>
    </DropDown>
  );
};
