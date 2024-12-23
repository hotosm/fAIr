import { TagsInfoIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { startMappingPageContent } from "@/constants";

export const ModelDetailsButton = ({
  popupAnchorId,
  onClick,
  showModelDetails = false,
}: {
  popupAnchorId?: string;
  onClick: () => void;
  showModelDetails?: boolean;
}) => {
  return (
    <ToolTip content={startMappingPageContent.modelDetails.tooltip}>
      <button
        id={popupAnchorId}
        className={`text-gray text-body-2 flex items-center p-1.5 hover:icon-interaction ${showModelDetails && "icon-interaction"}`}
        onClick={onClick}
      >
        <TagsInfoIcon className="icon" />
      </button>
    </ToolTip>
  );
};
