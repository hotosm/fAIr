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
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Feature, TModel, TTrainingDataset } from "@/types";
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
  [BASE_MODELS.RAMP]: {
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
  },
  [BASE_MODELS.YOLOV8_V1]: {
    epoch: {
      max: 150,
      min: 20,
    },
    batchSize: {
      max: 16,
      min: 8,
    },
    // These are not used
    contactSpacing: {
      max: 8,
      min: 1,
    },
    boundaryWidth: {
      max: 8,
      min: 1,
    },
  },
  [BASE_MODELS.YOLOV8_V2]: {
    epoch: {
      max: 150,
      min: 20,
    },

    batchSize: {
      max: 16,
      min: 8,
    },
    // These are not used
    contactSpacing: {
      max: 8,
      min: 1,
    },
    boundaryWidth: {
      max: 8,
      min: 1,
    },
  }

};

type FormData = {
  modelName: string;
  modelDescription: string;
  baseModel: BASE_MODELS;
  trainingDatasetOption: TrainingDatasetOption;
  datasetName: string;
  tmsURL: string;
  tmsURLValidation: {
    valid: boolean;
    message: string;
  };
  selectedTrainingDatasetId: string;
  trainingAreas: Feature[];
  oamTileName: string;
  oamBounds: number[];
  trainingType: TrainingType;
  contactSpacing: number;
  epoch: number;
  batchSize: number;
  boundaryWidth: number;
  zoomLevels: number[];
};

const initialFormState: FormData = {
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

const ModelsContext = createContext<{
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
  hasLabeledTrainingAreas: boolean;
  hasAOIsWithGeometry: boolean;
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
  hasLabeledTrainingAreas: false,
  hasAOIsWithGeometry: false,
});

export const ModelsProvider: React.FC<{
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

  const timeOutRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup the timeout on component unmount
    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
      }
    };
  }, []);

  const trainingRequestMutation = useCreateModelTrainingRequest({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingRequestSubmittedSuccess);
        // delay for a few seconds before resetting the state
        timeOutRef.current = setTimeout(() => {
          setFormData(initialFormState);
        }, 3000);
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
        navigate(
          `${APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION}?id=${data.id}`,
        );
        // Submit the model for training request
        trainingRequestMutation.mutate({
          model: data.id,
          input_boundary_width: formData.boundaryWidth,
          input_contact_spacing: formData.contactSpacing,
          epochs: formData.epoch,
          batch_size: formData.batchSize,
          zoom_level: formData.zoomLevels,
        });
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

  // Confirm that the training areas labels has been retrieved
  const hasLabeledTrainingAreas = useMemo(() => {
    return (
      formData.trainingAreas.filter(
        (aoi: Feature) => aoi.properties.label_fetched,
      ).length > 0
    );
  }, [formData]);
  // Confirm that at least one of the training areas has a geometry
  const hasAOIsWithGeometry = useMemo(() => {
    return (
      formData.trainingAreas.filter((aoi: Feature) => aoi.geometry !== null)
        .length > 0
    );
  }, [formData]);

  const memoizedValues = useMemo(
    () => ({
      formData,
      setFormData,
      handleChange,
      createNewTrainingDatasetMutation,
      createNewModelMutation,
      hasLabeledTrainingAreas,
      hasAOIsWithGeometry,
    }),
    [
      formData,
      setFormData,
      handleChange,
      createNewTrainingDatasetMutation,
      createNewModelMutation,
      hasLabeledTrainingAreas,
      hasAOIsWithGeometry,
    ],
  );

  return (
    <ModelsContext.Provider value={memoizedValues}>
      {children}
    </ModelsContext.Provider>
  );
};

export const useModelsContext = () => useContext(ModelsContext);
