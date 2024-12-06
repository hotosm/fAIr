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
      <p className="text-dark text-body-2base px-2 mb-4">
        {
          APP_CONTENT.models.modelsDetailsCard.modelFilesDialog
            .dialogDescription
        }
      </p>
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
