import { ToolTip } from "@/components/ui/tooltip";
import { ArrowMoveIcon } from "@/components/ui/icons";
import { mapContents } from "@/constants";

export const FitToBounds = ({ onClick }: { onClick: () => void }) => {
  return (
    <ToolTip content={mapContents.controls.fitToBounds.tooltip}>
      <button
        className="absolute top-[85px] bg-white z-[1] p-1.5"
        onClick={onClick}
      >
        <ArrowMoveIcon className="icon-lg" />
      </button>
    </ToolTip>
  );
};
