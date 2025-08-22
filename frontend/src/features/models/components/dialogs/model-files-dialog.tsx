import DirectoryTree from "@/features/models/components/directory-tree";
import { Dialog } from "@/components/ui/dialog";
import { DialogProps } from "@/types";
import { MODELS_CONTENT } from "@/constants";

type TrainingAreaDrawerProps = DialogProps & {
  trainingId: number;
  datasetId: number;
};

const ModelFilesDialog: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  datasetId,
  trainingId,
}) => {
  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={
        MODELS_CONTENT.models.modelsDetailsCard.modelFilesDialog.dialogTitle
      }
    >
      <p className="mb-4 px-2 text-body-2base text-dark">
        {
          MODELS_CONTENT.models.modelsDetailsCard.modelFilesDialog
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
