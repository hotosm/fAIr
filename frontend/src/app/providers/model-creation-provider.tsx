import { BASE_MODELS, TrainingType, TrainingDatasetOption } from "@/enums";

import { useCreateTrainingDataset } from "@/features/model-creation/hooks/use-training-datasets";
import { useLocalStorage } from "@/hooks/use-storage";
import {
  APPLICATION_ROUTES,
  HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
  showErrorToast,
  showSuccessToast,
  TMS_URL_REGEX_PATTERN,
  TOAST_NOTIFICATIONS,
} from "@/utils";
import { UseMutationResult } from "@tanstack/react-query";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { TModel, TTrainingDataset } from "@/types";
import { TCreateTrainingDatasetArgs } from "@/features/model-creation/api/create-trainings";
import {
  useCreateModel,
  useCreateModelTrainingRequest,
} from "@/features/model-creation/hooks/use-models";
import { TCreateModelArgs } from "@/features/model-creation/api/create-models";
import { LngLatBoundsLike } from "maplibre-gl";

/**
 * The names here are the same with the `initialFormState` object keys.
 * They are also the same with the form validation configuration object keys.
 */
export enum MODEL_CREATION_FORM_NAME {
  MODEL_NAME = "modelName",
  DATASET_NAME = "datasetName",
  MODEL_DESCRIPTION = "modelDescription",
  BASE_MODELS = "baseModel",
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
  OAM_TIME_NAME = "oamTileName",
  OAM_BOUNDS = "oamBounds",
  TRAINING_AREAS = "trainingAreas",
}

export const FORM_VALIDATION_CONFIG = {
  modelName: {
    maxLength: 40,
    minLength: 10,
  },
  tmsURL: {
    pattern: TMS_URL_REGEX_PATTERN.source,
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
  baseModel: BASE_MODELS.RAMP,
  trainingDatasetOption: TrainingDatasetOption.NONE,
  // create new dataset form
  datasetName: "",
  tmsURL: "",
  tmsURLValidation: {
    valid: false,
    message: "",
  },

  selectedTrainingDatasetId: "",
  trainingAreas: [],
  // oam tms info
  oamTileName: "",
  oamBounds: [],
  // Training settings - defaults to basic configurations
  trainingType: TrainingType.BASIC,
  epoch: 2,
  contactSpacing: 4,
  batchSize: 8,
  boundaryWidth: 3,
  zoomLevels: [20, 21],
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
      | Record<string, string | number | boolean>
      | LngLatBoundsLike,
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
  setFormData: () => {},
  handleChange: () => {},
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
      | Record<string, string | number | boolean>
      | LngLatBoundsLike,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const trainingRequestMutation = useCreateModelTrainingRequest({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingRequestSubmittedSuccess);
        setFormData(initialFormState);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const createNewTrainingDatasetMutation = useCreateTrainingDataset({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingDatasetCreationSuccess);
        handleChange(MODEL_CREATION_FORM_NAME.DATASET_NAME, data.name);
        handleChange(MODEL_CREATION_FORM_NAME.TMS_URL, data.source_imagery);
        handleChange(
          MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
          data.id,
        );
        // Navigate to the next step
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const createNewModelMutation = useCreateModel({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast(TOAST_NOTIFICATIONS.modelCreationSuccess);
        // Submit the model for training request
        trainingRequestMutation.mutate({
          model: data.id,
          input_boundary_width: formData.boundaryWidth,
          input_contact_spacing: formData.contactSpacing,
          epochs: formData.epoch,
          batch_size: formData.batchSize,
          zoom_level: formData.zoomLevels,
        });

        navigate(
          `${APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION}?id=${data.id}`,
        );
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  useEffect(() => {
    setValue(
      HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
      JSON.stringify(formData),
    );
  }, [formData]);

  const memoizedValues = useMemo(
    () => ({
      formData,
      setFormData,
      handleChange,
      createNewTrainingDatasetMutation,
      createNewModelMutation,
    }),
    [
      formData,
      setFormData,
      handleChange,
      createNewTrainingDatasetMutation,
      createNewModelMutation,
    ],
  );

  return (
    <ModelCreationFormContext.Provider value={memoizedValues}>
      {children}
    </ModelCreationFormContext.Provider>
  );
};

export const useModelFormContext = () => useContext(ModelCreationFormContext);
