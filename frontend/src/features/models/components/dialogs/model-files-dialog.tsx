import { Dialog } from "@/components/ui/dialog";
import DirectoryTree from "@/features/models/components/directory-tree";
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
  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.dialogTitle}
    >
      {isOpened && (
        <DirectoryTree
          trainingId={trainingId}
          datasetId={datasetId}
          isOpened={isOpened}
        />
      )}
    </Dialog>
  );
};

export default ModelFilesDialog;
