import { BASE_MODEL, TrainingType } from "@/enums";
import { TrainingDatasetOption } from "@/features/model-creation/components/training-dataset";
import { useCreateTrainingDataset } from "@/features/model-creation/hooks/use-training-datasets";
import { useLocalStorage } from "@/hooks/use-storage";
import {
  APPLICATION_ROUTES,
  HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
  URL_REGEX_PATTERN,
} from "@/utils";
import { UseMutationResult } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./toast-provider";
import { useNavigate } from "react-router-dom";
import { TModel, TTrainingDataset } from "@/types";
import { TCreateTrainingDatasetArgs } from "@/features/model-creation/api/create-trainings";
import { useCreateModel, useCreateModelTrainingRequest } from "@/features/model-creation/hooks/use-models";
import { TCreateModelArgs } from "@/features/model-creation/api/create-models";

// The names here is the same with the initialFormState object keys as well as the form validation config
export enum MODEL_CREATION_FORM_NAME {
  MODEL_NAME = "modelName",
  DATASET_NAME = "datasetName",
  MODEL_DESCRIPTION = "modelDescription",
  BASE_MODEL = "baseModel",
  TRAINING_DATASET_OPTION = "trainingDatasetOption",
  ZOOM_LEVELS = "zoomLevels",
  TRAINING_TYPE = "trainingType",
  EPOCH = "epoch",
  CONTACT_SPACING = "contactSpacing",
  BATCH_SIZE = "batchSize",
  BOUNDARY_WIDTH = "boundaryWidth",
  TMS_URL = "tmsURL",
  TMS_URL_VALIDITY = "tmsURLValidation",
  SELECTED_TRAINING_DATASET_ID = "selectedTrainingDatasetId",
  TRAINING_AREAS = "trainingAreas",
}

export const FORM_VALIDATION_CONFIG = {
  modelName: {
    maxLength: 40,
    minLength: 10,
  },
  tmsURL: {
    pattern: URL_REGEX_PATTERN,
  },
  modelDescription: {
    maxLength: 500,
    minLength: 10,
  },
  datasetName: {
    maxLength: 40,
    minLength: 10,
  },
  epoch: {
    max: 30,
    min: 1,
  },
  contactSpacing: {
    max: 8,
    min: 1,
  },
  batchSize: {
    max: 12,
    min: 1,
  },
  boundaryWidth: {
    max: 8,
    min: 1,
  },
};

const initialFormState = {
  modelName: "",
  modelDescription: "",
  baseModel: BASE_MODEL.RAMP.toLowerCase(),
  trainingDatasetOption: TrainingDatasetOption.NONE,
  // create new form
  datasetName: "",
  tmsURL: "",
  tmsURLValidation: {
    valid: false,
    message: "",
  },
  // training dataset selection
  selectedTrainingDatasetId: "",
  zoomLevels: [20, 21],
  trainingAreas: [],
  // Defaults to basic configurations
  trainingType: TrainingType.BASIC,
  epoch: 2,
  contactSpacing: 4,
  batchSize: 8,
  boundaryWidth: 3,
};

const ModelCreationFormContext = createContext<{
  formData: typeof initialFormState;
  setFormData: React.Dispatch<React.SetStateAction<typeof initialFormState>>;
  handleChange: (
    field: string,
    value:
      | string
      | boolean
      | number
      | number[]
      | Record<string, string | number | boolean>,
  ) => void;
  createNewTrainingDatasetMutation: UseMutationResult<
    TTrainingDataset,
    Error,
    TCreateTrainingDatasetArgs,
    unknown
  >;
  createNewModelMutation: UseMutationResult<
    TModel,
    Error,
    TCreateModelArgs,
    unknown
  >;
}>({
  formData: initialFormState,
  setFormData: () => { },
  handleChange: () => { },
  createNewTrainingDatasetMutation: {} as UseMutationResult<
    TTrainingDataset,
    Error,
    TCreateTrainingDatasetArgs,
    unknown
  >,
  createNewModelMutation: {} as UseMutationResult<
    TModel,
    Error,
    TCreateModelArgs,
    unknown
  >,
});

export const ModelCreationFormProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { setValue, getValue } = useLocalStorage();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<typeof initialFormState>(() => {
    const savedData = getValue(HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : initialFormState;
  });

  const handleChange = (
    field: string,
    value:
      | string
      | boolean
      | number
      | number[]
      | Record<string, string | number | boolean>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const trainingRequestMutation = useCreateModelTrainingRequest({
    mutationConfig: {
      onSuccess: () => {
        notify("Training request submitted successfully", "success");
      },
      onError: (error) => {
        // @ts-expect-error bad type definition
        const errorText = error?.response?.data[0] ?? "An error ocurred while submitting training request"
        notify(errorText, "danger");
      },
    }
  });

  const createNewTrainingDatasetMutation = useCreateTrainingDataset({
    mutationConfig: {
      onSuccess: (data) => {
        notify("Dataset created successfully", "success");
        handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, data.name);
        handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, data.source_imagery);
        handleChange(
          MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
          data.id,
        );
        // Navigate to the next step
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA);
      },
      onError: () => {

        notify("An error occurred while creating dataset", "danger");
      },
    },
  });

  const createNewModelMutation = useCreateModel({
    mutationConfig: {
      onSuccess: (data) => {
        notify("Model created successfully", "success");
        // Submit the model for training request
        trainingRequestMutation.mutate({
          model: data.id,
          input_boundary_width: formData.boundaryWidth,
          input_contact_spacing: formData.contactSpacing,
          epochs: formData.epoch,
          batch_size: formData.batchSize,
          zoom_level: formData.zoomLevels

        })

        setFormData(initialFormState);

        navigate(
          `${APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION}?id=${data.id}`,

        );
      },
      onError: () => {
        notify("An error ocurred while creating model", "danger");
      },
    },
  });

  useEffect(() => {
    setValue(
      HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
      JSON.stringify(formData),
    );
  }, [formData]);

  return (
    <ModelCreationFormContext.Provider
      value={{
        formData,
        setFormData,
        handleChange,
        createNewTrainingDatasetMutation,
        createNewModelMutation,
      }}
    >
      {children}
    </ModelCreationFormContext.Provider>
  );
};

export const useModelFormContext = () => useContext(ModelCreationFormContext);
