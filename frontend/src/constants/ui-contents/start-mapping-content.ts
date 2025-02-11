import { TStartMappingPageContent } from '@/types';

export const START_MAPPING_PAGE_CONTENT: TStartMappingPageContent = {
  pageTitle: (modelName: string) => `Start Mapping with ${modelName}`,
  map: {
    controls: {
      fitToBoundsControl: {
        tooltip: "Click to adjust the map view to fit the imagery bounds.",
      },
      legendControl: {
        title: "Legend",
        acceptedPredictions: "Accepted Predictions",
        rejectedPredictions: "Rejected Predictions",
        predictionResults: "Prediction Results",
      },
      layerControl: {
        acceptedPredictions: "Rejected Predictions",
        rejectedPredictions: "Accepted Predictions",
        results: "Prediction Results",
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
    useJOSMQ: {
      label: "Use JOSM Q",
      tooltip: "use JOSM Q",
    },
    confidence: {
      label: "Confidence",
      tooltip: "confidence",
    },
    tolerance: {
      label: "Tolerance",
      tooltip: "tolerance",
    },
    area: {
      label: "Area",
      tooltip: "area",
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
};
