import { Dialog } from "@/components/ui/dialog";
import DirectoryTree from "@/features/models/components/directory-tree";
import { useDevice } from "@/hooks/use-device";

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
      label={"Model Files"}
      size={isMobile ? "extra-large" : "medium"}
    >
      <DirectoryTree trainingId={trainingId} datasetId={datasetId} />
    </Dialog>
  );
};

export default ModelFilesDialog;
