import { Dialog } from "@/components/ui/dialog";
import useDevice from "@/hooks/use-device";
import { MapComponent } from "@/components/map";
import { cn } from "@/utils";
import { DialogProps } from "@/types";

type TrainingAreaDialogProps = DialogProps;

const TrainingAreaDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
}) => {
  const isMobile = useDevice();

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={"Training Area"}
      size={isMobile ? "extra-large" : "large"}
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
