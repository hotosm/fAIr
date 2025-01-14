import useScreenSize from "@/hooks/use-screen-size";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { TagsInfoIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";

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
        !isSmallViewport
          ? START_MAPPING_PAGE_CONTENT.modelDetails.tooltip
          : null
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
