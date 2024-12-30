import { BASE_MODELS } from '@/enums';
import { formatAreaInAppropriateUnit } from '@/utils';
import { MAX_TRAINING_AREA_SIZE, MIN_TRAINING_AREA_SIZE } from '../config';
import { TModelsContent } from '@/types';

export const MODELS_CONTENT: TModelsContent = {
  trainingArea: {
    // The retry button when the training area map fails to load as a result of an API error or any other issue.
    retryButton: "retry",
    modalTitle: "Training Area",
    map: {
      loadingText: "Loading map...",
    },
  },
  myModels: {
    pageTitle: "My Models",
    pageHeader: "My Models",
    pageDescription:
      "Your archived, draft and published models are here. Each model is trained using one of the training datasets. Published models can be used to find mappable features in imagery that is similar to the training areas that dataset comes from.",
  },
  modelCreation: {
    modelDetails: {
      pageTitle: "Create New Local AI Model",
      form: {
        modelName: {
          label: "Model Name",
          helpText:
            "Model name should be at least 10 characters and at most 40 characters.",
          placeholder: "Enter the model name",
          toolTip: "Model Name",
        },
        baseModel: {
          label: "Base Model",
          helpText: "Select the base model to use for the training.",
          toolTip: "Base Model",
          suffixes: {
            [BASE_MODELS.RAMP]: "Faster training time, with decent accuracy.",
            [BASE_MODELS.YOLOV8_V1]: "Good for major areas and more accurate.",
            [BASE_MODELS.YOLOV8_V2]:
              "Our best model yet. Good for every type of area.",
          },
        },
        modelDescription: {
          label: "Model Description",
          toolTip: "Model Description",
          helpText:
            "Model description should be at least 10 characters and at most 500 characters.",
          placeholder: "Enter the model description",
        },
      },
      pageDescription:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!",
    },
    trainingDataset: {
      pageTitle: "Training Dataset",
      buttons: {
        createNew: "Create a New Training Dataset",
        selectExisting: "Select From Existing Training Dataset",
      },
      form: {
        datasetName: {
          label: "Dataset Name",
          helpText:
            "Dataset name should be at least 10 characters and at most 40 characters.",
          placeholder: "Enter the datatset name",
          toolTip: "Dataset Name",
        },
        tmsURL: {
          label: "TMS URL",
          toolTip: "TMS URL",
          helpText:
            "TMS imagery link should look like this https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}",
          placeholder: "https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}",
        },
        existingTrainingDatasetSectionHeading: "Existing Training Dataset",
        newTrainingDatasetSectionHeading: "Create New Training Dataset",
        searchBar: {
          placeholder: "Search",
        },
      },
      editModePageDescription:
        "You cannot edit a model dataset when editing...",
      pageDescription:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!",
    },
    trainingArea: {
      toolTips: {
        fetchOSMLabels: "Fetch OSM Labels",
        lastUpdatedPrefix: "OSM Last Updated:",
        zoomToAOI: "Zoom to AOI",
        openINJOSM: "Open in JOSM",
        openInIdEditor: "Open in ID Editor",
        downloadAOI: "Download AOI",
        downloadLabels: "Download AOI Labels",
        uploadLabels: "Upload AOI Labels",
        deleteAOI: "Delete AOI",
        fitToTMSBounds: "Fit to Bounds",
      },
      pageTitle: "Create Training Area",
      datasetID: "Dataset ID:",
      tutorialText: "Tutorial",
      layerControl: {
        tmsLayerName: "TMS Layer",
        trainingAreaLayerName: "Training Areas",
      },
      openAerialMapErrorMessage:
        "Invalid TMS provided. Please go back to select another training dataset.",
      form: {
        openAerialMap: "Open Aerial Imagery",
        maxZoom: "Max zoom:",
        minZoom: "Min zoom:",
        trainingArea: "Training Area",
        draw: "Draw",
        upload: "Upload",
      },
      fileUploadDialog: {
        title: "Upload Training Area(s)",
        mainInstruction:
          "Drag 'n' drop some files here, or click to select files",
        fleSizeInstruction:
          "Supports only GeoJSON (.geojson) files. (5MB max.)",
        aoiAreaInstruction: `Area should be > ${formatAreaInAppropriateUnit(MIN_TRAINING_AREA_SIZE)} and < ${formatAreaInAppropriateUnit(MAX_TRAINING_AREA_SIZE)}.`,
      },
      pageDescription:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!",
    },
    modelSummary: {
      pageTitle: "Model Summary",
      form: {
        modelName: "Model Name",
        modelDescription: "Model Description",
        baseModel: "Base Model",
        datasetName: "Dataset Name",
        datasetId: "Dataset ID",
        openAerialImagery: "Open Aerial Imagery",
        zoomLevels: "Zoom Levels",
        trainingSettings: "Training Settings",
      },
      pageDescription:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!",
    },
    confirmation: {
      buttons: {
        enhanceModel: "enhance model",
        goToModel: "go to model",
        exploreModels: "explore models",
      },
      description:
        "Your created model was succesfull, and it is now undergoing a training.",
    },
    trainingSettings: {
      form: {
        zoomLevel: {
          label: "Select Zoom Level",
          toolTip: "Select Zoom Level",
        },
        trainingType: {
          label: "Select Model Training Type",
          toolTip: "Select Model Training Type",
        },
        advancedSettings: {
          label: "Advanced Settings",
          toolTip: "Advanced Settings",
        },
        epoch: {
          label: "Epoch",
          toolTip: "Epoch",
        },
        contactSpacing: {
          label: "Contact Spacing",
          toolTip: "Contact Spacing",
        },
        batchSize: {
          label: "Batch Size",
          toolTip: "Batch Size",
        },
        boundaryWidth: {
          label: "Boundary Width",
          toolTip: "Boundary Width",
        },
      },
      pageTitle: "Model Training Settings",
      pageDescription:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!",
    },
    progressStepper: {
      modelDetails: "Model Details",
      trainingDataset: "Training Dataset",
      trainingArea: "Training Area",
      trainingSettings: "Training Settings",
      submitModel: "Submit Model",
      confirmation: "Confirmation",
    },
    progressButtons: {
      back: "back",
      continue: "continue",
    },
  },
  models: {
    modelsList: {
      pageTitle: "fAIr AI models",
      description: `Each model is trained using one of the training datasets. Published models can be used to find mappable features in imagery that is similar to the training areas that dataset comes from.`,
      ctaButton: "Create Model",
      filtersSection: {
        searchPlaceHolder: "Search",
        mapViewToggleText: "Map View",
      },
      sortingAndPaginationSection: {
        modelCountSuffix: "models",
        sortingTitle: "Sort by",
      },
      modelCard: {
        accuracy: "Accuracy:",
        lastModified: "Last Modified:",
        baseModel: "Base Model:",
      },
    },
    modelsDetailsCard: {
      datasetId: "Dataset ID: ",
      datasetName: "Dataset Name: ",
      modelId: "Model ID:",
      detailsSectionTitle: "Details",
      createdBy: "Created By",
      createdOn: "Created On",
      lastModified: "Last Modified",
      trainingId: "Training ID:",
      propertiesSectionTitle: "Properties",
      trainingHistorySectionTitle: "Training History",
      enhanceModel: "Enhance Model",
      feedbacks: "View Feedbacks",
      startMapping: "Start Mapping",
      modelDescriptionNotAvailable: "Model description is not available.",
      viewTrainingArea: "View Training Area",
      viewFeedbacks: "View Feedbacks",
      modelFiles: "Model Files",
      properties: {
        zoomLevels: {
          title: "Zoom Levels",
          tooltip:
            "Those are the zoom level tiles imagery that was used when training this model",
        },
        epochs: {
          title: "Epochs",
          tooltip:
            "Refers to the total number of times that the whole training datasets has been learned by the model",
        },
        contactSpacing: {
          title: "Contact Spacing",
          tooltip:
            "The distance in pixels to extend the area around each building. This will be used to find points where buildings come into contact or are in close proximity to one another. For example, entering '8' will explore areas within 8 pixels outside the original building shapes to detect nearby buildings",
        },
        currentDatasetSize: {
          title: "Current Dataset Size",
          tooltip: "The total number of images used to train this model",
        },
        baseModel: {
          title: "Base Model",
          tooltip: "",
          href: {
            RAMP: "https://rampml.global/",
            YOLO_V8_V2: "https://yolov8.com/ ",
            YOLO_V8_V1: "https://yolov8.com/ ",
          },
        },
        sourceImage: {
          title: "Source Image (TMS)",
          tooltip:
            "The tile server link used to train this model, click on the copy icon to copy the TMS link",
        },
        trainingId: {
          title: "Training Id",
          tooltip: "The training Id.",
        },

        batchSize: {
          title: "Batch Size",
          tooltip:
            "Refers to the total number of images that is fed into the model training in each batch until the whole training dataset is used to train the model",
        },
        accuracy: {
          title: "Accuracy",
          tooltip:
            "Refers to the training sparse categorical accuracy of RAMP model or YOLO accuracy of the model",
        },
        boundaryWidth: {
          title: "Boundary Width",
          tooltip:
            "Specify the width in pixels to reduce the original building shape inwardly, creating a boundary or margin around each building. A smaller value creates a tighter boundary close to the building's edges, while a larger value creates a wider surrounding area. For example, entering '3' will create a boundary that 3 pixles inside from the original building edges.",
        },
      },
      trainingHistoryTableHeader: {
        trainingHistoryCount: "Training History",
        id: "ID",
        epochAndBatchSize: "Epochs / Batch Size",
        startedAt: "Started At",
        sumittedBy: "Submitted by",
        duration: "Duration",
        dsSize: "DS Size",
        accuracy: "Accuracy (%)",
        status: "Status",
        info: "Info",
        action: "Action",
        inUse: "In Use",
      },
      modelFilesDialog: {
        rootDirectory: "Root Directory",
        dialogTitle: "Model Files",
        dialogDescription: "Click to download each file...",
        error: "Error loading directories.",
      },
      trainingInfoDialog: {
        status: "Status",
        logs: "Logs",
      },
      modelUpdate: {
        dialogHeading: "Edit Model Details",
        editButtonText: "Edit Model Details",
        saveButtonText: "Save",
      },
      trainingSettings: {
        dialogHeading: "Model Training Settings",
        description:
          "Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut",
        submitButtonText: "Submit",
      },
      modelEnhancement: {
        newSettings: {
          title: "Enhance with New Settings",
          description:
            "Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
        },
        trainingData: {
          title: "Enhance with Training Data",
          description:
            "Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
        },
      },
    },
  },
};
