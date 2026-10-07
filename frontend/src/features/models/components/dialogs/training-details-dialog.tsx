import ModelProperties from "@/features/models/components/model-details-properties";
import useScreenSize from "@/hooks/use-screen-size";
import { Dialog } from "@/components/ui/dialog";
import { DialogProps } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";

type TrainingDetailsDialogProps = DialogProps & {
  trainingId: number;
};

const TrainingDetailsDialog: React.FC<TrainingDetailsDialogProps> = ({
  isOpened,
  closeDialog,
  trainingId,
}) => {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <Drawer
        open={isOpened}
        setOpen={closeDialog}
        placement={DrawerPlacements.BOTTOM}
        noHeader={false}
      >
        <ModelProperties trainingId={trainingId} isTrainingDetailsDialog />
      </Drawer>
    );
  }

  return (
    <>
      <Dialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        label={`Training ${trainingId}`}
      >
        <ModelProperties trainingId={trainingId} isTrainingDetailsDialog />
      </Dialog>
    </>
  );
};

export default TrainingDetailsDialog;
