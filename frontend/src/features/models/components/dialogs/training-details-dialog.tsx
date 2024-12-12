import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import ModelProperties from "@/features/models/components/model-details-properties";
import useScreenSize from "@/hooks/use-screen-size";
import { DialogProps } from "@/types";


type TrainingDetailsDialogProps = DialogProps & {
  trainingId: number;
  datasetId: number;
  baseModel: string;
};

const TrainingDetailsDialog: React.FC<TrainingDetailsDialogProps> = ({
  isOpened,
  closeDialog,
  trainingId,
  datasetId,
  baseModel,
}) => {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <Drawer open={isOpened} setOpen={closeDialog} placement="bottom" noHeader={false}>
        <ModelProperties
          trainingId={trainingId}
          isTrainingDetailsDialog
          datasetId={datasetId}
          baseModel={baseModel}
        />
      </Drawer>
    )
  }

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={`Training ${trainingId}`}
    >
      <ModelProperties
        trainingId={trainingId}
        isTrainingDetailsDialog
        datasetId={datasetId}
        baseModel={baseModel}
      />
    </Dialog>
  );
};

export default TrainingDetailsDialog;
