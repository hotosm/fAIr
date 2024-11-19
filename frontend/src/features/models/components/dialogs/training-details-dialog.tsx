import { Dialog } from "@/components/ui/dialog";

import ModelProperties from "@/features/models/components/model-details-properties";
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
