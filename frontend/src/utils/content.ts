// App wide text contents. Extracted outside of components
// for easier internalization when necessary.

import { APPLICATION_ROUTES } from "./constants";
export const APP_CONTENT = {
  navbar: {
    logoAlt: "HOT fAIr Logo",
    loginButton: "Login",
    hamburgerMenuAlt: "Hamburger Menu Icon",
    hamburgerMenuTitle: "Toggle Menu",
    routes: {
      exploreModels: "Explore Models",
      about: "About",
      resources: "Resources",
      learn: "Learn",
    },
    userProfile: {
      models: "My Models",
      settings: "Settings",
      logout: "Log Out",
    },
  },
  footer: {
    title:
      "We pursue Just tech to amplify connections between human[itarian] needs and open map data.",
    copyright: {
      firstSegment:
        "Images are screenshots of fAIr may be shared under a Creatives Commons Attribution-ShareAlike 4.0 International License.",
      secondSegment:
        "Free and Open Source Software brought to you by the Humanitarian OpenStreetMap Team.",
    },
    socials: {
      ctaText: "Learn more about OpenStreetMap.",
    },
    madeWithLove: {
      firstSegment: "Made with ❤️ by",
      secondSegment: "HOT",
      thirdSegment: "&",
      fourthSegment: "friends",
    },
    siteMap: {
      groupOne: [
        {
          title: "explore models",
          route: APPLICATION_ROUTES.MODELS,
        },
        {
          title: "learn",
          route: APPLICATION_ROUTES.LEARN,
        },
        {
          title: "about",
          route: APPLICATION_ROUTES.ABOUT,
        },
      ],
      groupTwo: [
        {
          title: "resources",
          route: APPLICATION_ROUTES.RESOURCES,
        },
        {
          title: "privacy policy",
          route: "#",
        },
      ],
    },
  },
  homepage: {
    jumbotronTitle: "Your AI Mapping Partner",
    jumbotronHeadline:
      "AI-powered assistant that amplify your mapping efforts intelligently and quickly, helping you map smarter and faster.",
    ctaPrimaryButton: "Create Model",
    ctaSecondaryButton: "Start Mapping",
    jumbotronImageAlt: "A user engaging in a mapping activity",
    kpi: {
      publishedAIModels: "Published AI Models",
      totalUsers: "Total Registered Users",
      humanFeedback: "Human Feedbacks",
      acceptedPrediction: "Accepted Prediction",
    },
    aboutTitle: "WHAT IS fAIr?",
    aboutContent: `fAIr is an open AI-assisted mapping service developed by the Humanitarian OpenStreetMap Team (HOT) that aims to improve the efficiency and accuracy of mapping efforts for humanitarian purposes. The service uses AI models, specifically computer vision techniques, to detect objects in satellite and UAV imagery.`,
    fairProcess: {
      title: "fAIr process",
      stepOne: {
        title: "Create Model",
        description:
          "Create a customized and localized AI models using open source (or your) imagery and your customized labels with support by OSM open data",
      },
      stepTwo: {
        title: "Run Prediction",
        description:
          "Run prediction/inference in a live environment or define your area of interest to run your local model and get the data.",
      },
      stepThree: {
        title: "Feedback",
        description:
          "Get live human feedback about the quality of your localized model to support your decision to enhance the model accuracy.",
      },
      stepFour: {
        title: "Use Data",
        description:
          "Make the produced data open and available for humanitarian actors to take actions for impact",
      },
    },
    coreFeatures: {
      featureOne: "Time Efficient",
      featureTwo: "High Accuracy",
      featureThree: "Re-usable/Resilience",
    },
    coreValues: {
      sectionTitle: {
        firstSegment: `It's`,
        secondSegment: "your map,",
        thirdSegment: "fAIr",
        fourthSegment: "just makes it",
        fifthSegment: "faster",
      },
      community: {
        title: "Community Driven",
        description:
          "fAIr follows a community driven approach to decide on the features that will be implemented. We are continuously engaging with local communities to shape the direction and the future of AI-assisted humanitarian mapping",
      },
      humansNotReplaced: {
        title: "Humans in the loop",
        description:
          "As part of the community approach, humans are involved in the whole fAIr process, from creating models till reaching high quality data and gather feedback",
      },
    },
    faqs: {
      sectionTitle: "faqs",
      cta: "See more",
      content: [
        {
          question: "What is fAIr?",
          answer:
            "fAIr is a free and open source AI assisted mapping tool that gives local communities the ability to create their localized AI models to amplify their humanitarian mapping efforts.",
        },
        {
          question: "Who can use fAIr?",
          answer:
            "Anyone can use fAIr with basic authentication (log in) and they will be able to explore the community crated AI models and use them for mapping and create their own new models.",
        },
        {
          question: "Can I use fAIr without having a sound knowledge of AI?",
          answer:
            "fAIr is designed for users without the need for Python or any programming skills. However, basic knowledge in  humanitarian mapping and Geographical Information Systems (GIS) would be sufficient for self exploration.",
        },
      ],
    },
    tagline: {
      firstSegment: "Built",
      secondSegment: "for and",
      thirdSegment: "loved",
      fourthSegment: "by",
      fifthSegment: "Mappers",
    },
    callToAction: {
      title: `We can't do it without you`,
      ctaButton: "Join The Community",
      ctaLink: "https://slack.hotosm.org",
      paragraph:
        "fAIr is a collaborative project. We welcome all types of experience to join our community on HOTOSM Slack. There is always a room for AI/ML for earth observation expertise, community engagement enthusiastic, academic researcher or student looking for an academic challenge around social impact.",
    },
  },
  pageNotFound: {
    messages: {
      constant: "Oh sorry,",
      modelNotFound: "model not found",
      trainingDatasetNotFound: "training dataset not found",
      pageNotFound: "page not found",
    },
    actionButtons: {
      modelNotFound: "Explore models",
      trainingDatasetNotFound: "Explore training datasets",
      pageNotFound: "go to homepage",
    },
  },
  protectedPage: {
    ctaButton: "login",
    messageParagraph: "To access this page you have to login.",
    messageTitle: "This page is private",
  },
  errorBoundary: {
    title: "Ooops, Something went wrong :(",
    button: "refresh",
  },
  construction: {
    message: "This page is under construction. Please check back.",
    button: "Go home",
  },
  loginButtonLoading: "Logging in...",
  toasts: {
    authenticationFailed: "Login failed.",
    loginSuccess: "Login successful.",
    logoutSuccess: "Logout successful.",
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
      },
    },
    modelsDetailsCard: {
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
            YOLOv8: "https://yolov8.com/ ",
          },
        },
        sourceImage: {
          title: "Source Image (TMS)",
          tooltip:
            "The tile server link used to train this model, click on the copy icon to copy the TMS link",
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
        error: "Error loading directories.",
      },
      trainingInfoDialog: {
        status: "Status",
        logs: "Logs",
      },
    },
  },
};
