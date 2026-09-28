import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { TOfflinePrediction } from "@/types";
import { showSuccessToast } from "@/utils";

type MapRequestsActionsMenuProps = {
  prediction: TOfflinePrediction;
  /** Provided handlers gate which items appear. */
  onDownloadResult?: (prediction: TOfflinePrediction) => void;
  onCopyResultLink?: (prediction: TOfflinePrediction) => void;
  onCreateMapswipe?: (prediction: TOfflinePrediction) => void;
  onPublishResult?: (prediction: TOfflinePrediction) => void;
};

export const MapRequestsActionsMenu = ({
  prediction,
  onDownloadResult,
  onCopyResultLink,
  onCreateMapswipe,
  onPublishResult,
}: MapRequestsActionsMenuProps) => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const { copyToClipboard } = useCopyToClipboard();

  const items: { label: string; onClick: () => void }[] = [];

  if (onDownloadResult)
    items.push({
      label: "Download result",
      onClick: () => onDownloadResult(prediction),
    });

  if (onCopyResultLink)
    items.push({
      label: "Copy result link",
      onClick: () => onCopyResultLink(prediction),
    });

  if (onCreateMapswipe)
    items.push({
      label: prediction.mapswipe_project_id
        ? "View MapSwipe project"
        : "Create MapSwipe project",
      onClick: () => onCreateMapswipe(prediction),
    });

  items.push({
    label: "Copy imagery link",
    onClick: async () => {
      await copyToClipboard(prediction.image_uri ?? "");
      showSuccessToast("Copied imagery link to clipboard.");
    },
  });

  if (onPublishResult)
    items.push({
      label: prediction.published ? "Retract result" : "Publish Result",
      onClick: () => onPublishResult(prediction),
    });

  return (
    <DropDown
      ref={dropdownRef}
      placement={DropdownPlacement.BOTTOM_END}
      disableCheveronIcon
      distance={8}
      triggerComponent={
        <span className="flex size-8 items-center justify-center rounded-[9.33px] bg-off-white text-dark">
          <ElipsisIcon className="size-4 rotate-90" />
        </span>
      }
    >
      <div className="w-[200px] rounded-lg bg-white p-1 shadow-lg">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              item.onClick();
              onDropdownHide();
            }}
            className="w-full rounded-md px-3 py-2.5 text-left text-body-3 text-dark hover:bg-off-white"
          >
            {item.label}
          </button>
        ))}
      </div>
    </DropDown>
  );
};
