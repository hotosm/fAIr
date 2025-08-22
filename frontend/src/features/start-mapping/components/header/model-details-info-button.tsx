import { DropDown } from "@/components/ui/dropdown";
import { TagsInfoIcon } from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import useScreenSize from "@/hooks/use-screen-size";
import { ModelDetailsInfo } from "@/features/start-mapping/components/header/model-details-info";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { ToolTip } from "@/components/ui/tooltip";
import { TModelDetails } from "@/types";
import { useCallback, useState } from "react";

export const ModelDetailsInfoButton = ({
  modelInfo,
  modelInfoRequestIsPending,
  modelInfoRequestIsError,
  predictionModel,
}: {
  modelInfo?: TModelDetails;
  modelInfoRequestIsPending?: boolean;
  modelInfoRequestIsError?: boolean;
  predictionModel: string;
}) => {
  const { isSmallViewport } = useScreenSize();
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const handleClick = useCallback(() => {
    if (isSmallViewport) {
      setShowDrawer(true);
    }
  }, [isSmallViewport]);
  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_START}
      disableCheveronIcon
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      triggerComponent={
        <ToolTip
          content={
            !isSmallViewport
              ? START_MAPPING_PAGE_CONTENT.modelDetails.tooltip
              : null
          }
        >
          <button
            className={
              "p-1 flex items-center justify-center hover:icon-interaction"
            }
            onClick={handleClick}
          >
            <TagsInfoIcon className="icon-lg md:size-5 text-grey" />
          </button>
        </ToolTip>
      }
    >
      <ModelDetailsInfo
        modelInfo={modelInfo}
        modelInfoRequestIsPending={modelInfoRequestIsPending}
        modelInfoRequestIsError={modelInfoRequestIsError}
        showMobileDrawer={showDrawer}
        setShowMobileDrawer={setShowDrawer}
        predictionModel={predictionModel}
      />
    </DropDown>
  );
};
