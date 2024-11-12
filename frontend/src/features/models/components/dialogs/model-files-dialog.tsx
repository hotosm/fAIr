import { Dialog } from "@/components/ui/dialog";
import { SHOELACE_SIZES } from "@/enums";
import DirectoryTree from "@/features/models/components/directory-tree";
import useScreenSize from "@/hooks/use-screen-size";
import { DialogProps } from "@/types";
import { APP_CONTENT } from "@/utils";

type TrainingAreaDialogProps = DialogProps & {
  trainingId: number;
  datasetId: number;
};

const ModelFilesDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
  datasetId,
  trainingId,
}) => {
  const { isMobile, isLaptop, isTablet } = useScreenSize();;
  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.dialogTitle}
      size={isMobile || isTablet ? SHOELACE_SIZES.EXTRA_LARGE : isLaptop ? SHOELACE_SIZES.LARGE : SHOELACE_SIZES.MEDIUM}
    >
      <DirectoryTree trainingId={trainingId} datasetId={datasetId} />
    </Dialog>
  );
};

export default ModelFilesDialog;
