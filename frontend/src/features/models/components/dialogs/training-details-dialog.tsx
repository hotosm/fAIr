import { Dialog } from "@/components/ui/dialog";
import useScreenSize from "@/hooks/use-screen-size";
import ModelProperties from "@/features/models/components/model-details-properties";
import { DialogProps } from "@/types";
import { SHOELACE_SIZES } from "@/enums";

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
  const { isMobile, isTablet, isLaptop } = useScreenSize();;

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={`Training ${trainingId}`}
      size={isMobile || isTablet ? SHOELACE_SIZES.EXTRA_LARGE : isLaptop ? SHOELACE_SIZES.LARGE : SHOELACE_SIZES.MEDIUM}
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
