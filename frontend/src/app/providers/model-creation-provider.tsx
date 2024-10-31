import { BASE_MODEL, TrainingType } from "@/enums";
import { TrainingDatasetOption } from "@/features/model-creation/components/training-dataset";
import { useLocalStorage } from "@/hooks/use-storage";
import {
  HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
  URL_REGEX_PATTERN,
} from "@/utils";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  handleChange: (field: string, value: string | boolean | number) => void;
}>({
  formData: initialFormState,
  setFormData: () => {},
  handleChange: () => {},
});

export const ModelCreationFormProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { setValue, getValue } = useLocalStorage();

  const [formData, setFormData] = useState<typeof initialFormState>(() => {
    const savedData = getValue(HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : initialFormState;
  });

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setValue(
      HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
      JSON.stringify(formData),
    );
  }, [formData]);

  return (
    <ModelCreationFormContext.Provider
      value={{ formData, setFormData, handleChange }}
    >
      {children}
    </ModelCreationFormContext.Provider>
  );
};

export const useModelFormContext = () => useContext(ModelCreationFormContext);
