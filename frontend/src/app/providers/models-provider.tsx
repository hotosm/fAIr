import {
  APPLICATION_ROUTES,
  MODELS_BASE,
  MODELS_ROUTES,
  TOAST_NOTIFICATIONS,
} from "@/constants";
import {
  BASE_MODELS,
  TileServiceType,
  TrainingDatasetOption,
  TrainingType,
} from "@/enums";
import { HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY } from "@/config";
import { LngLatBoundsLike } from "maplibre-gl";
import { useCreateTrainingDataset } from "@/features/model-creation/hooks/use-training-datasets";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { UseMutationResult } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-storage";

import {
  TModelDetails,
  TTrainingAreaFeature,
  TTrainingDataset,
  TTrainingDetails,
} from "@/types";
import {
  showErrorToast,
  showSuccessToast,
  XYZ_TILESERVER_URL_REGEX_PATTERN,
} from "@/utils";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TCreateTrainingDatasetArgs,
  TCreateTrainingRequestArgs,
} from "@/features/model-creation/api/create-trainings";
import {
  useCreateModel,
  useCreateModelTrainingRequest,
  useUpdateModel,
} from "@/features/model-creation/hooks/use-models";
import axios from "axios";
import { useAuth } from "./auth-provider";

/**
 * The names here are the same with the `initialFormState` object keys.
 * They are also the same with the form validation configuration object keys.
 */
export enum MODEL_CREATION_FORM_NAME {
  MODEL_NAME = "modelName",
  DATASET_NAME = "datasetName",
  DATASET_OFFSET = "datasetOffset",
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
  OAM_TILE_NAME = "oamTileName",
  OAM_BOUNDS = "oamBounds",
  TRAINING_AREAS = "trainingAreas",
  TRAINING_SETTINGS_IS_VALID = "trainingSettingsIsValid",
  TILESERVICE_TYPE = "tileserviceType",
}

export const FORM_VALIDATION_CONFIG = {
  [MODEL_CREATION_FORM_NAME.MODEL_NAME]: {
    maxLength: 40,
    minLength: 10,
  },
  [MODEL_CREATION_FORM_NAME.TMS_URL]: {
    pattern: XYZ_TILESERVER_URL_REGEX_PATTERN.source,
  },
  [MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]: {
    maxLength: 500,
    minLength: 10,
  },
  [MODEL_CREATION_FORM_NAME.DATASET_NAME]: {
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
  },
};

type FormData = {
  modelName: string;
  modelDescription: string;
  baseModel: BASE_MODELS;
  trainingDatasetOption: TrainingDatasetOption;
  datasetName: string;
  tmsURL: string;
  selectedTrainingDatasetId: string;
  trainingAreas: TTrainingAreaFeature[];
  oamTileName: string;
  oamBounds: number[];
  trainingType: TrainingType;
  contactSpacing: number;
  epoch: number;
  batchSize: number;
  boundaryWidth: number;
  zoomLevels: number[];
  trainingSettingsIsValid: boolean;
  tileserviceType: TileServiceType;
  datasetOffset: number[];
};

const initialFormState: FormData = {
  [MODEL_CREATION_FORM_NAME.MODEL_NAME]: "",
  [MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION]: "",
  [MODEL_CREATION_FORM_NAME.BASE_MODELS]: BASE_MODELS.RAMP,
  [MODEL_CREATION_FORM_NAME.TRAINING_DATASET_OPTION]:
    TrainingDatasetOption.USE_EXISTING,
  // create new dataset form
  [MODEL_CREATION_FORM_NAME.DATASET_NAME]: "",
  [MODEL_CREATION_FORM_NAME.TMS_URL]: "",
  [MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID]: "",
  [MODEL_CREATION_FORM_NAME.TRAINING_AREAS]: [],
  // oam tms info
  [MODEL_CREATION_FORM_NAME.OAM_TILE_NAME]: "",
  [MODEL_CREATION_FORM_NAME.OAM_BOUNDS]: [],
  // Training settings - defaults to basic configurations
  [MODEL_CREATION_FORM_NAME.TRAINING_TYPE]: TrainingType.BASIC,
  [MODEL_CREATION_FORM_NAME.EPOCH]: 2,
  [MODEL_CREATION_FORM_NAME.CONTACT_SPACING]: 4,
  [MODEL_CREATION_FORM_NAME.BATCH_SIZE]: 8,
  [MODEL_CREATION_FORM_NAME.BOUNDARY_WIDTH]: 3,
  [MODEL_CREATION_FORM_NAME.ZOOM_LEVELS]: [19, 20, 21],
  [MODEL_CREATION_FORM_NAME.TRAINING_SETTINGS_IS_VALID]: true,
  [MODEL_CREATION_FORM_NAME.TILESERVICE_TYPE]: TileServiceType.XYZ,
  [MODEL_CREATION_FORM_NAME.DATASET_OFFSET]: [0, 0],
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
  hasLabeledTrainingAreas: boolean;
  hasAOIsWithGeometry: boolean;
  resetState: () => void;
  createNewTrainingRequestMutation: UseMutationResult<
    TTrainingDetails,
    Error,
    TCreateTrainingRequestArgs,
    unknown
  >;
  isEditMode: boolean;
  modelId?: string;
  getFullPath: (path: string) => string;
  handleModelCreationAndUpdate: () => void;
  validateEditMode: boolean;
  isError: boolean;
  isPending: boolean;
  data: TModelDetails;
  isModelOwner: boolean;
  modelCreationOrUpdateInProgress: boolean;
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
  createNewTrainingRequestMutation: {} as UseMutationResult<
    TTrainingDetails,
    Error,
    TCreateTrainingRequestArgs,
    unknown
  >,
  hasLabeledTrainingAreas: false,
  hasAOIsWithGeometry: false,
  resetState: () => {},
  isEditMode: false,
  modelId: "",
  getFullPath: () => "",
  handleModelCreationAndUpdate: () => {},
  validateEditMode: false,
  isPending: false,
  isError: false,
  data: {} as TModelDetails,
  isModelOwner: false,
  modelCreationOrUpdateInProgress: false,
});

export const ModelsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { modelId, id } = useParams();

  const { setValue, removeValue, getValue } = useLocalStorage();
  const storedFormData = getValue(HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY);
  const [formData, setFormData] = useState<typeof initialFormState>(
    storedFormData ? JSON.parse(storedFormData) : initialFormState,
  );
  const { user, isAuthenticated } = useAuth();

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
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };
      setValue(
        HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedData),
      );
      return updatedData;
    });
  };

  const getFullPath = (path: string) =>
    `${isEditMode ? MODELS_BASE + "/" + modelId : MODELS_ROUTES.CREATE_MODEL_BASE}/${path}/`;

  const timeOutRef = useRef<number | null>(null);

  const isEditMode = Boolean(modelId && !pathname.includes("new"));

  const { data, isPending, isError, error } = useModelDetails(
    id ?? (modelId as string),
    !!id || !!modelId,
    10000,
  );

  const isModelOwner = isAuthenticated && data?.user?.osm_id === user?.osm_id;

  // Will be used in the route validator component to delay the redirection for a while until the data are retrieved
  const validateEditMode =
    formData.selectedTrainingDatasetId !== "" && formData.tmsURL !== "";

  useEffect(() => {
    if (isError && error) {
      const currentPath = pathname;
      if (axios.isAxiosError(error)) {
        navigate(APPLICATION_ROUTES.NOTFOUND, {
          state: {
            from: currentPath,
            error: error.response?.data?.detail,
          },
        });
      } else {
        const err = error as Error;
        navigate(APPLICATION_ROUTES.NOTFOUND, {
          state: {
            from: currentPath,
            error: err.message,
          },
        });
      }
    }
  }, [isError, error, navigate]);

  // Prefill formData with model details in edit mode.
  useEffect(() => {
    if (!isEditMode || isPending || !data || isError) return;

    handleChange(MODEL_CREATION_FORM_NAME.BASE_MODELS, data.base_model);
    handleChange(
      MODEL_CREATION_FORM_NAME.MODEL_DESCRIPTION,
      data.description ?? "",
    );
    handleChange(MODEL_CREATION_FORM_NAME.MODEL_NAME, data.name ?? "");
    handleChange(
      MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
      data.dataset.id,
    );
    handleChange(
      MODEL_CREATION_FORM_NAME.DATASET_NAME,
      data.dataset.name ?? "",
    );
    handleChange(
      MODEL_CREATION_FORM_NAME.TMS_URL,
      data.dataset.source_imagery ?? "",
    );
    handleChange(MODEL_CREATION_FORM_NAME.DATASET_OFFSET, data.dataset.offset);
  }, [isEditMode, isError, isPending, data]);

  const resetState = () => {
    removeValue(HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY);
    setFormData(initialFormState);
  };

  useEffect(() => {
    // Cleanup the timeout on component unmount
    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    /**
     * During model creation, don't reset the state on unmount to keep track of the users progress and to persist the data during page refresh.
     * But during edit mode, clean it up on unmount to ensure the forms are on a clean slate.
     * Given that there is already an effect that prefills the form above in edit mode, this won't affect edit mode state.
     */
    if (!isEditMode) return;
    // Cleanup the state on component unmount
    return () => {
      resetState();
    };
  }, []);

  const createNewTrainingRequestMutation = useCreateModelTrainingRequest({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(TOAST_NOTIFICATIONS.trainingRequestSubmittedSuccess);
      },
      onError: (error) => {
        showErrorToast(error);
        resetState();
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
        handleChange(MODEL_CREATION_FORM_NAME.DATASET_OFFSET, data.offset);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const submitTrainingRequest = useCallback(
    (id: string) => {
      createNewTrainingRequestMutation.mutate({
        model: id,
        input_boundary_width: formData.boundaryWidth,
        input_contact_spacing: formData.contactSpacing,
        epochs: formData.epoch,
        batch_size: formData.batchSize,
        zoom_level: formData.zoomLevels,
      });
    },
    [formData, modelId],
  );

  const handleModelCreationOrUpdateSuccess = (id: string) => {
    if (isEditMode && isModelOwner) {
      showSuccessToast(TOAST_NOTIFICATIONS.modelUpdateSuccess);
    } else if (!isEditMode) {
      showSuccessToast(TOAST_NOTIFICATIONS.modelCreationSuccess);
    }

    navigate(`${getFullPath(MODELS_ROUTES.CONFIRMATION)}?id=${id}`);
    // Submit the model for training request
    submitTrainingRequest(id);
  };

  const modelCreateMutation = useCreateModel({
    mutationConfig: {
      onSuccess: (data) => {
        handleModelCreationOrUpdateSuccess(data.id);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const modelUpdateMutation = useUpdateModel({
    mutationConfig: {
      onSuccess: (data) => {
        handleModelCreationOrUpdateSuccess(data.id);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
    modelId: modelId as string,
  });

  // Confirm that all the training areas labels have been fetched.
  const hasLabeledTrainingAreas = useMemo(
    () =>
      formData.trainingAreas.length > 0 &&
      formData.trainingAreas.every(
        (aoi: TTrainingAreaFeature) => aoi.properties.label_fetched !== null,
      ),
    [formData],
  );

  // Confirm that all of the training areas have a geometry.
  const hasAOIsWithGeometry = useMemo(
    () =>
      formData.trainingAreas.length > 0 &&
      formData.trainingAreas.every(
        (aoi: TTrainingAreaFeature) => aoi.geometry !== null,
      ),
    [formData],
  );

  const handleModelCreationAndUpdate = () => {
    // The user is trying to edit their model.
    // In this case, send a PATCH request and submit a training request.
    if (isEditMode && isModelOwner) {
      modelUpdateMutation.mutate({
        dataset: formData.selectedTrainingDatasetId,
        name: formData.modelName,
        description: formData.modelDescription,
        base_model: formData.baseModel as BASE_MODELS,
        modelId: modelId as string,
      });
      // The user is trying to edit another users model training area and settings.
      // In this case, directly submit a training request.
    } else if (isEditMode && !isModelOwner) {
      handleModelCreationOrUpdateSuccess(modelId as string);
    } else {
      modelCreateMutation.mutate({
        dataset: formData.selectedTrainingDatasetId,
        name: formData.modelName,
        description: formData.modelDescription,
        base_model: formData.baseModel,
      });
    }
  };

  const modelCreationOrUpdateInProgress = useMemo(
    () => modelCreateMutation.isPending || modelUpdateMutation.isPending,
    [modelCreateMutation.isPending, modelUpdateMutation.isPending],
  );

  const memoizedValues = useMemo(
    () => ({
      setFormData,
      handleChange,
      createNewTrainingDatasetMutation,
      hasLabeledTrainingAreas,
      hasAOIsWithGeometry,
      formData,
      createNewTrainingRequestMutation,
      isEditMode,
      modelId,
      getFullPath,
      handleModelCreationAndUpdate,
      validateEditMode,
      resetState,
      data,
      isPending,
      isError,
      isModelOwner,
      modelCreationOrUpdateInProgress,
    }),
    [
      setFormData,
      formData,
      handleChange,
      createNewTrainingDatasetMutation,
      hasLabeledTrainingAreas,
      hasAOIsWithGeometry,
      createNewTrainingRequestMutation,
      isEditMode,
      modelId,
      resetState,
      getFullPath,
      handleModelCreationAndUpdate,
      validateEditMode,
      data,
      isPending,
      isError,
      isModelOwner,
      modelCreationOrUpdateInProgress,
    ],
  );

  return (
    <ModelsContext.Provider value={memoizedValues}>
      {children}
    </ModelsContext.Provider>
  );
};

export const useModelsContext = () => useContext(ModelsContext);
