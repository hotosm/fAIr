import { TStartMappingPageContent } from "@/types";

export const START_MAPPING_PAGE_CONTENT: TStartMappingPageContent = {
  pageTitle: (modelName: string) => `Start Mapping with ${modelName}`,
  map: {
    controls: {
      fitToBoundsControl: {
        tooltip: "Fit to TMS Bounds",
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
      defaultTitle: "Action",
      commentTitle: "Comment",
      accept: "Accept",
      reject: "Reject",
      resolve: "Resolve",
      comment: {
        description: "Reason for rejecting (Optional)",
        placeholder: "Incorrect prediction...",
        submit: "Submit",
        submissionInProgress: "Submitting...",
      },
      description:
        "loremLorem ipsum, dolor sit amet consectetur adipisicing elit. Quas aperia...",
    },
  },
  buttons: {
    runPrediction: "Run prediction",
    tooltip: "Zoom in to run predictions",
    download: {
      label: "Actions",
      options: {
        allFeatures: "All features as GeoJSON",
        acceptedFeatures: "Accepted features as GeoJSON",
        openAllFeaturesInJOSM: "Open all Features to JOSM",
        openAcceptedFeaturesInJOSM: "Open accepted Features to JOSM",
      },
    },
    predictionInProgress: "Running...",
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
    disabledModeTooltip: (param: string) => `Run prediction to ${param}`,
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
