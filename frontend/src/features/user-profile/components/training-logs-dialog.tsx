import { Dialog } from "@/components/ui/dialog";
import { DialogProps } from "@/types";
import { TrainingLogs } from "@/components/shared/training-logs";

type TrainingLogsDialogProps = DialogProps & {
  taskId: string;
};

export const TrainingLogsDialog: React.FC<TrainingLogsDialogProps> = ({
  isOpened,
  closeDialog,
  taskId,
}) => {
  return (
    <>
      <Dialog isOpened={isOpened} closeDialog={closeDialog} label={"Training Logs"}>
        <TrainingLogs taskId={taskId} expandByDefault disableExpandButton />
      </Dialog>
    </>
  );
};
