import {
  FORM_VALIDATION_CONFIG,
  MODEL_CREATION_FORM_NAME,
} from "@/app/providers/models-provider";
import { XYZTileServerInput } from "@/components/shared/form/xyz-tile-server-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { MODELS_CONTENT, TOAST_NOTIFICATIONS } from "@/constants";
import { ButtonVariant, TileServiceType } from "@/enums";
import { useCallback, useEffect, useState } from "react";
import {
  useCreateTrainingDataset,
  useUpdateTrainingDataset,
} from "@/features/model-creation/hooks/use-training-datasets";
import { showErrorToast, showSuccessToast } from "@/utils";
import { TTrainingDataset, TValidationState } from "@/types";

const validateDatasetName = (name: string) => {
  const min =
    FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME].minLength;
  const max =
    FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME].maxLength;

  if (name.length < min)
    return { valid: false, message: `Must be at least ${min} characters.` };
  if (name.length > max)
    return { valid: false, message: `Must not exceed ${max} characters.` };

  return { valid: true, message: "" };
};

export const NewTrainingDatasetForm = ({
  datasetName,
  onClick,
  tileServiceType,
  setTileServiceType,
  tileserverURL,
  setTileserverURL,
  tileServiceTypeValidity,
  setTileServiceTypeValidity,
  loading,
  tileJSONMetadata,
  buttonText = "Create Dataset",
  isCreateNewDataset = false,
  onSuccess,
  trainingDatasetId,
}: {
  datasetName: string;
  onClick?: () => void;
  tileServiceType: TileServiceType;
  setTileServiceType: (tileServiceType: TileServiceType) => void;
  tileserverURL: string;
  setTileserverURL: (url: string) => void;
  tileServiceTypeValidity: { valid: boolean; message: string };
  setTileServiceTypeValidity: (validity: {
    valid: boolean;
    message: string;
  }) => void;
  loading?: boolean;
  tileJSONMetadata?: any | null;
  buttonText?: string;
  isCreateNewDataset?: boolean;
  onSuccess?: (data: TTrainingDataset) => void;
  trainingDatasetId?: number;
}) => {
  const [trainingdatasetName, setTrainingDatasetName] =
    useState<string>(datasetName);
  const [datasetNameValidity, setDatasetNameValidity] = useState({
    valid: false,
    message: "",
  });
  const handleDatasetNameValidity = (e: TValidationState) => {
    setDatasetNameValidity(e);
  };

  const datasetCreateMutation = useCreateTrainingDataset({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingDatasetCreationSuccess);
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const datasetUpdateMutation = useUpdateTrainingDataset({
    mutationConfig: {
      onSuccess: (data) => {
        if (onSuccess) {
          onSuccess(data);
        }
        showSuccessToast("Dataset updated successfully");
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
    datasetId: trainingDatasetId ?? 0,
  });

  const handleTrainingDatasetCreation = useCallback(() => {
    datasetCreateMutation.mutate({
      source_imagery: tileserverURL,
      name: trainingdatasetName,
    });
  }, [datasetCreateMutation, tileserverURL, trainingdatasetName]);

  const handleTrainingDatasetUpdate = useCallback(() => {
    datasetUpdateMutation.mutate({
      id: trainingDatasetId ?? 0, // Provide a default value
      source_imagery: tileserverURL,
      name: trainingdatasetName,
    });
  }, [datasetUpdateMutation, tileserverURL, trainingdatasetName]);

  const handleClick = useCallback(() => {
    if (isCreateNewDataset) {
      handleTrainingDatasetCreation();
    } else {
      handleTrainingDatasetUpdate();
    }
    if (onClick) {
      onClick();
    }
  }, [
    isCreateNewDataset,
    handleTrainingDatasetCreation,
    handleTrainingDatasetUpdate,
    onClick,
  ]);

  /**
   * Set the validity of the dataset name on component mount.
   */
  useEffect(() => {
    setDatasetNameValidity(validateDatasetName(trainingdatasetName));
  }, [trainingdatasetName]);

  const disabled =
    datasetCreateMutation.isPending || datasetUpdateMutation.isPending;
  return (
    <div className="flex w-full flex-col gap-y-10">
      <Input
        handleInput={(e) => setTrainingDatasetName(e.target.value)}
        value={trainingdatasetName}
        toolTipContent={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.toolTip
        }
        label={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName.label
        }
        labelWithTooltip
        placeholder={
          MODELS_CONTENT.modelCreation.trainingDataset.form.datasetName
            .placeholder
        }
        isValid={datasetNameValidity.valid}
        validationStateUpdateCallback={handleDatasetNameValidity}
        showBorder
        helpText={datasetNameValidity.message}
        maxLength={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
            .maxLength
        }
        minLength={
          FORM_VALIDATION_CONFIG[MODEL_CREATION_FORM_NAME.DATASET_NAME]
            .minLength
        }
      />
      <div>
        <XYZTileServerInput
          isValid={tileServiceTypeValidity}
          setTileServerURL={(e) => setTileserverURL(e)}
          tileServerURL={tileserverURL}
          validationStateUpdateCallback={(validationState) =>
            setTileServiceTypeValidity(validationState)
          }
          tileServiceType={tileServiceType}
          setTileServiceType={setTileServiceType}
        />
      </div>
      {tileJSONMetadata !== null && tileserverURL.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-border p-2 text-body-4 text-grey">
          <p className="font-semibold text-dark">TileJSON Metadata</p>
          {Object.entries(tileJSONMetadata).map(([key, value]) => (
            <p key={key}>
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
              {Array.isArray(value) ? value.join(", ") : value?.toString()}
            </p>
          ))}
        </div>
      )}
      <Button
        variant={ButtonVariant.DARK}
        className="w-full md:w-1/2"
        onClick={handleClick}
        disabled={
          disabled ||
          !tileServiceTypeValidity.valid ||
          !datasetNameValidity.valid ||
          loading
        }
      >
        {disabled ? <Spinner /> : buttonText}
      </Button>
    </div>
  );
};
