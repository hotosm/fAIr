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
            "Model name should be short, clear and be at least 10 characters and at most 40 characters.",
          placeholder: "E.g Damaged building detection model",
          toolTip: "Model name will be searchable in the explore model page",
        },
        baseModel: {
          label: "Base Model",
          helpText: "Choose a base model to use for training. All base models currently support building detection.",
          toolTip: "A base model is the pre-trained model that serves as the foundation for fine-tuning your local AI model.",
          suffixes: {
            [BASE_MODELS.RAMP]: "Optimized for faster training with decent accuracy. Best suited for building detection tasks.",
            [BASE_MODELS.YOLOV8_V1]: "A well-balanced model offering good accuracy for detecting structures in major areas. Trained by the community.",
            [BASE_MODELS.YOLOV8_V2]:
              "Our most advanced model. Designed for detecting various features across different areas. Developed in collaboration with Omdena AI.",
          },
        },
        modelDescription: {
          label: "Model Description",
          toolTip: "",
          helpText:
            "Model description should descriptive, be at least 10 characters and at most 500 characters.",
          placeholder: "This model is used to detect damaged buildings in ...",
        },
      },
      pageDescription:
        "Model creation has steps as shown above. Please enter your model metadata below.",
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
          placeholder: "E.g Kakuma OpenAerial Imagery",
          toolTip: "Dataset Name",
        },
        tmsURL: {
          label: "TMS URL",
          toolTip: "Enter the Tile Map Service (TMS) URL. You can input the TMS from OpenAerialMap (OAM), or provide a custom one.",
          helpText:
            "TMS imagery link should look like this https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}",
          placeholder: "https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}",
        },
        existingTrainingDatasetSectionHeading: "Existing Training Dataset",
        existingTrainingDatasetSectionDescription: 'Browse or search for a dataset name. Select a dataset to proceed.',
        newTrainingDatasetSectionHeading: "Create New Training Dataset",
        searchBar: {
          placeholder: "Enter a dataset name to search",
        },
      },
      editModePageDescription:
        "You cannot edit a model dataset when editing...",
      pageDescription:
        "A training dataset consists of high-resolution aerial imagery used as the base layer for fine-tuning your AI model. You can either create a new dataset or select existing imagery that covers your area of interest.",
    },
    trainingArea: {
      toolTips: {
        labelsFetchInProgress: "Processing labels...",
        fetchOSMLabels: "Click to retrieve mapped buildings from OpenStreetMap (OSM) for this area. These buildings will be used as training labels to help the model learn.",
        lastUpdatedPrefix: "OSM last synced:",
        zoomToAOI: "Click to zoom to this training area.",
        openINJOSM: "Click to open this training area in JOSM.",
        openInIdEditor: "Click to open this training area in ID Editor.",
        downloadAOI: "Click to download this training area as GeoJSON.",
        downloadLabels: "Click to download the labels in this training area as GeoJSON.",
        uploadLabels: "Click to upload training labels for this training area.",
        deleteAOI: "Click to delete this training area.",
        fitToTMSBounds: "Click to adjust the map view to fit the imagery bounds.",
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
        "Make sure you create at least one training area and data is accurate for each training area",
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
        "Please check all the model details before you proceed!",
    },
    confirmation: {
      buttons: {
        enhanceModel: "enhance model",
        goToModel: "go to model",
        exploreModels: "explore models",
      },
      description:
        "Your created model was successful, and it is now undergoing a training.",
    },
    trainingSettings: {
      form: {
        zoomLevel: {
          label: "Select Zoom Level",
          toolTip: "Choose the zoom level for training. A higher zoom level provides finer details but may increase training time.",
        },
        trainingType: {
          label: "Select Model Training Type",
          toolTip: "Choose the type of model training to apply.",
        },
        advancedSettings: {
          label: "Advanced Settings",
          toolTip: "Modify additional parameters for fine-tuning your model training.",
        },
        epoch: {
          label: "Epoch",
          toolTip: "Specify the number of training iterations. A higher number improves learning.",
        },
        contactSpacing: {
          label: "Contact Spacing",
          toolTip: "Defines the minimum spacing between detected objects during training.",
        },
        batchSize: {
          label: "Batch Size",
          toolTip: "The number of training samples processed in one step. A larger batch size may speed up training.",
        },
        boundaryWidth: {
          label: "Boundary Width",
          toolTip: "Determines the width of the boundary around detected objects, affecting how edges are handled.",
        },
      },
      pageTitle: "Model Training Settings",
      pageDescription: "Customize your model training preferences by selecting the appropriate options below.",
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
      startMapping: "Map with AI Model",
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
          "Please make sure the following settings are accurate!",
        submitButtonText: "Submit",
      },
      modelEnhancement: {
        newSettings: {
          title: "Enhance with New Settings",
          description:
            "Enhance the model by using the same training dataset but fine tuning again using different training setting!",
        },
        trainingData: {
          title: "Enhance with Training Data",
          description:
            "Enhance the model and its training dataset, you will be redirected to model creation progress and have the ability to modify the training dataset and then submit a new training with your preferred training settings",
        },
      },
    },
  },
};
