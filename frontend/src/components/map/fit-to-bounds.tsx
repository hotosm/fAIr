import { ToolTip } from "@/components/ui/tooltip";
import { FullScreenIcon } from "@/components/ui/icons";
import { mapContents } from "@/constants";

export const FitToBounds = ({ onClick }: { onClick: () => void }) => {
  return (
    <ToolTip content={mapContents.controls.fitToBounds.tooltip}>
      <button
        className="absolute left-3 top-28 bg-white z-[1] p-1.5"
        onClick={onClick}
      >
        <FullScreenIcon className="icon-lg" />
      </button>
    </ToolTip>
  );
};
