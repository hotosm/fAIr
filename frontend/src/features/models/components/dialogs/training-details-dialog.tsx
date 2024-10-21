import { Dialog } from "@/components/ui/dialog";
import useDevice from "@/hooks/use-device";
import ModelProperties from "@/features/models/components/model-details-properties";

type TrainingDetailsDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  trainingId: number;
  datasetId:number 
};

const TrainingDetailsDialog: React.FC<TrainingDetailsDialogProps> = ({
  isOpened,
  closeDialog,
  trainingId,datasetId
}) => {
  const isMobile = useDevice();

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={`Training ${trainingId}`}
      size={isMobile ? "extra-large" : "medium"}
    >
      <ModelProperties trainingId={trainingId} isTrainingDetailsDialog datasetId={datasetId}/>
    </Dialog>
  );
};

export default TrainingDetailsDialog;
