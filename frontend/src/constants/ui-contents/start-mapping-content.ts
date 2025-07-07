import { TStartMappingPageContent } from "@/types";

export const START_MAPPING_PAGE_CONTENT: TStartMappingPageContent = {
  pageTitle: (modelName: string) => `Start Mapping with ${modelName}`,
  map: {
    controls: {
      fitToBoundsControl: {
        tooltip: "Click to adjust the map view to fit the imagery bounds.",
      },
      legendControl: {
        toolTip: {
          show: "Show Legend",
          hide: "Hide Legend",
        },
        title: "Predictions",
        acceptedPredictions: "Accepted",
        rejectedPredictions: "Rejected",
        predictionResults: "Default",
      },
      layerControl: {
        results: "Model predictions",
      },
    },
    popup: {
      defaultTitle: "Confirm Building Selection",
      commentTitle: "Comment",
      accept: "Accept",
      reject: "Reject",
      resolve: "Resolve",
      comment: {
        description: "Reason for rejecting (Optional)",
        placeholder: "E.g Incorrect prediction...",
        submit: "Submit",
        submissionInProgress: "Submitting...",
      },
      description:
        "This building has been detected. You can either accept it as a valid prediction or reject it if it's incorrect.",
    },
  },
  buttons: {
    runPrediction: "Generate Predictions",
    tooltip: "Zoom in to generate predictions",
    download: {
      label: "Actions",
      options: {
        allFeatures: (prefix: string) => `${prefix} features as GeoJSON`,
        acceptedFeatures: (prefix: string) => `${prefix} features as GeoJSON`,
        openAllFeaturesInJOSM: "Open all features in JOSM",
        openAcceptedFeaturesInJOSM: "Open accepted features in JOSM",
      },
    },
    predictionInProgress: "Generating...",
  },
  settings: {
    orthogonalize: {
      label: "Orthogonalize",
      tooltip: "Returns predictions in regular shape",
    },
    confidence: {
      label: "Confidence",
      tooltip: "Filters predictions lower than specified confidence of model",
    },
    tolerance: {
      label: "Tolerance",
      tooltip: "Higher values give a smoother, simpler shape",
    },
    area: {
      label: "Area",
      tooltip: "Filters prediction geometries below than specified area",
    },
    maxAngleChange: {
      label: "Skew Tolerance",
      tooltip:
        "Defines the maximum allowed deviation from a perfectly orthogonal (90-degree) angle. A higher value allows for greater angular imperfection in the detected features, which can be useful for noisy or irregular data.",
    },
    skewTolerance: {
      label: "Max Angle Change",
      tooltip:
        "Sets the largest angle change permitted between successive segments of a detected feature. A lower value will result in smoother, less angular features, while a higher value can capture sharper turns.",
    },
    tooltip: "Settings",
  },
  mapData: {
    title: "Predictions",
    accepted: "Accepted",
    rejected: "Rejected",
  },
  actions: {
    disabledModeTooltip: (param: string) => `Run predictions to ${param}`,
  },
  modelDetails: {
    error: "Error retrieving model information.",
    label: "Model Details",
    tooltip: "Model Details",
    popover: {
      title: "Model Details",
      modelId: "Model ID",
      description: "Description",
      lastModified: "Last Modified",
      trainingId: "Training ID",
      datasetId: "Dataset ID",
      datasetName: "Dataset Name",
      zoomLevel: "Zoom Levels",
      accuracy: "Accuracy",
      baseModel: "Base Model",
    },
  },
  replicableModel: {
    info: "⚠️ You are trying to run the model on an image different from the one it was trained with, the result might not be accurate.",
    apply: "Apply",
    loading: "Loading...",
  },
};
