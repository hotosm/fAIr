export const START_MAPPING_CONTENT = {
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
    runPrediction: "run predictions",
    download: {
      label: "download",
      options: {
        allFeatures: "All Features as GeoJSON",
        acceptedFeatures: "Accepted Features Only",
        openAllFeaturesInJOSM: "Open All Features in JOSM",
        openAcceptedFeaturesInJOSM: "Open All Features in JOSM",
      },
    },
    predictionInProgress: "running",
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
  },
  mapData: {
    title: "Map Data",
    accepted: "Accepted",
    rejected: "Rejected",
  },
  modelDetails: {
    error: "Error retrieving model information.",
    label: "Model Details",
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
