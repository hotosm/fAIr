import { TagsInfoIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { startMappingPageContent } from "@/constants";
import useScreenSize from "@/hooks/use-screen-size";

export const ModelDetailsButton = ({
  popupAnchorId,
  onClick,
  modelDetailsPopupIsActive = false,
}: {
  popupAnchorId?: string;
  onClick: () => void;
  modelDetailsPopupIsActive?: boolean;
}) => {
  const { isSmallViewport } = useScreenSize();
  return (
    <ToolTip
      content={
        !isSmallViewport ? startMappingPageContent.modelDetails.tooltip : null
      }
    >
      <button
        id={popupAnchorId}
        className={`text-gray text-body-2 flex items-center p-1.5 hover:icon-interaction ${modelDetailsPopupIsActive && "icon-interaction"}`}
        onClick={onClick}
      >
        <TagsInfoIcon className="icon" />
      </button>
    </ToolTip>
  );
};
