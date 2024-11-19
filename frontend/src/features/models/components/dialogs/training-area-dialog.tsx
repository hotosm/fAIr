import { Dialog } from "@/components/ui/dialog";
import useScreenSize from "@/hooks/use-screen-size";
import { MapComponent } from "@/components/map";
import { cn } from "@/utils";
import { DialogProps } from "@/types";
import { SHOELACE_SIZES } from "@/enums";

type TrainingAreaDialogProps = DialogProps;

const TrainingAreaDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
}) => {
  const { isMobile } = useScreenSize();

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={"Training Area"}
      size={isMobile ? SHOELACE_SIZES.EXTRA_LARGE : SHOELACE_SIZES.LARGE}
    >
      <div className={cn(`${!isMobile ? "h-[600px]" : "h-[350px]"}`)}>
        <div className="h-full w-full">
          <MapComponent />
        </div>
      </div>
    </Dialog>
  );
};

export default TrainingAreaDialog;
