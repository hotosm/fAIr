// WIP - Make toasts feature based like in startMapping below

export const TOAST_NOTIFICATIONS = {
  // start mapping
  startMapping: {
    feedback: {
      success: "Feedback submitted successfully.",
    },
    approvedPrediction: {
      success: "Saved successfully.",
    },
    resolved: {
      success: "Action resolved successfully.",
    },
    modelPrediction: {
      success: "Model predictions retrieved successfully.",
    },
    fileDownloadSuccess: "Download successful.",
  },

  // Training dataset
  trainingDataset: {
    error: "Error loading training dataset",
  },
  // Map - Geolocation

  geolocationNotSupported: "Geolocation is not supported by this browser.",

  // Map - Drawing mode activation

  drawingModeActivated:
    "Draw mode activated. Hover on the map to start drawing",

  // Training area/aoi
  trainingAreasFileUploadSuccess: "Training areas created successfully.",
  trainingLabelsFetchSuccess: "Training labels fetched successfully.",
  trainingAreaDeletionSuccess: "Training area deleted successfully.",
  aoiLabelsUploadSuccess: "AOI Labels uploaded successfully.",
  aoiDownloadSuccess: "AOI downloaded successfully.",
  trainingRequestSubmittedSuccess: "Training request submitted successfully.",
  trainingDatasetCreationSuccess: "Dataset created successfully.",

  // Training area validation
  aoiWithoutGeometryWarning:
    "This training area does not have a geometry. Delete it and redraw a new training area.",
  aoiLabelsDownloadSuccess: "AOI labels downloaded successfully.",

  // Model creation/update

  modelCreationSuccess: "Model created successfully.",
  modelUpdateSuccess: "Model updated successfully.",

  // JOSM
  errorLoadingData: "An error occurred while loading data",
  dataLoadingSuccess: "Data loaded successfully",
  josmOpenSuccess: "Map view opened in JOSM successfully!",
  josmBBOXZoomFailed: "Failed to zoom to the bounding box in JOSM.",
  josmImageryLoadFailed: "Failed to load imagery in JOSM.",
  josmOpenFailed:
    "An error occurred while opening in JOSM. Confirm you have JOSM opened on your computer and remote control enabled.",

  // File download

  fileDownloadFailed: "Failed to download file.",
  fileDownloadSuccess: "File downloaded successfully!",

  // Authentication

  authenticationFailed: "Login failed.",
  loginSuccess: "Login successful.",
  logoutSuccess: "Logout successful.",
};
