import { Dialog } from "@/components/ui/dialog";
import DirectoryTree from "@/features/models/components/directory-tree";
import useDevice from "@/hooks/use-device";
import { APP_CONTENT } from "@/utils";

type TrainingAreaDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  trainingId: number;
  datasetId: number;
};

const ModelFilesDialog: React.FC<TrainingAreaDialogProps> = ({
  isOpened,
  closeDialog,
  datasetId,
  trainingId,
}) => {
  const isMobile = useDevice();
  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.dialogTitle}
      size={isMobile ? "extra-large" : "medium"}
    >
      <DirectoryTree trainingId={trainingId} datasetId={datasetId} />
    </Dialog>
  );
};

export default ModelFilesDialog;
