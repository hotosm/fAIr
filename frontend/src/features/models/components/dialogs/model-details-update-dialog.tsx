import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import ModelDescriptionFormInput from "@/features/model-creation/components/model-details/model-description-input";
import ModelNameFormInput from "@/features/model-creation/components/model-details/model-name-input";
import { useUpdateModel } from "@/features/model-creation/hooks/use-models";
import { TModel } from "@/types";
import { APP_CONTENT, showErrorToast, showSuccessToast } from "@/utils";
import { useState } from "react";
import { TOAST_NOTIFICATIONS } from "@/constants";

type ModelDetailsUpdateDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  data: TModel;
};
const ModelDetailsUpdateDialog: React.FC<ModelDetailsUpdateDialogProps> = ({
  isOpened,
  closeDialog,
  data,
}) => {
  const [modelName, setModelName] = useState(data.name ?? "");
  const [modelDescription, setModelDescription] = useState(
    data.description ?? "",
  );
  const modelUpdateMutation = useUpdateModel({
    modelId: data.id,
    mutationConfig: {
      onSuccess: () => {
        closeDialog();
        showSuccessToast(TOAST_NOTIFICATIONS.modelUpdateSuccess);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });
  const handleSubmit = async () => {
    await modelUpdateMutation.mutateAsync({
      modelId: data.id,
      name: modelName,
      description: modelDescription,
    });
  };

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={closeDialog}
      label={APP_CONTENT.models.modelsDetailsCard.modelUpdate.dialogHeading}
    >
      <div className="flex flex-col gap-y-4">
        <ModelNameFormInput
          value={modelName}
          handleChange={(value) => setModelName(value)}
        />
        <ModelDescriptionFormInput
          value={modelDescription}
          handleChange={(value) => setModelDescription(value)}
        />
        <div className="self-end">
          <Button
            disabled={
              (modelDescription.length === 0 && modelName.length === 0) ||
              modelUpdateMutation.isPending
            }
            onClick={handleSubmit}
          >
            {APP_CONTENT.models.modelsDetailsCard.modelUpdate.saveButtonText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ModelDetailsUpdateDialog;
