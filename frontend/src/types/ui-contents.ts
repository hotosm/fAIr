import { IconProps } from "./common";
// Models related pages content types starts.

export type TModelsContent = {
  trainingArea: {
    retryButton: string;
    modalTitle: string;
    map: {
      loadingText: string;
    };
  };
  myModels: {
    pageTitle: string;
    pageHeader: string;
    pageDescription: string;
  };
  modelCreation: {
    modelDetails: {
      pageTitle: string;
      form: {
        modelName: {
          label: string;

          placeholder: string;
          toolTip: string;
        };
        baseModel: {
          label: string;
          helpText: string;
          toolTip: string;
          suffixes: Record<string, string>;
        };
        modelDescription: {
          label: string;
          toolTip: string;

          placeholder: string;
        };
      };
      pageDescription: string;
    };
    trainingDataset: {
      pageTitle: string;
      buttons: {
        createNew: string;
        selectExisting: string;
      };
      form: {
        datasetName: {
          label: string;
          helpText: string;
          placeholder: string;
          toolTip: string;
        };
        existingTrainingDatasetSectionDescription: string;

        searchBar: {
          placeholder: string;
        };
      };
      editModePageDescription: string;
      pageDescription: string;
    };
    trainingArea: {
      toolTips: {
        labelsFetchInProgress: string;
        fetchOSMLabels: string;
        lastUpdatedPrefix: string;
        zoomToAOI: string;
        openINJOSM: string;
        openInIdEditor: string;
        downloadAOI: string;
        downloadLabels: string;
        uploadLabels: string;
        deleteAOI: string;
        fitToTMSBounds: string;
      };
      pageTitle: string;
      datasetID: string;
      tutorialText: string;
      layerControl: {
        tmsLayerName: string;
        trainingAreaLayerName: string;
      };
      openAerialMapErrorMessage: string;
      form: {
        openAerialMap: string;
        maxZoom: string;
        minZoom: string;
        trainingArea: string;
        draw: string;
        upload: string;
      };
      fileUploadDialog: {
        title: string;
        mainInstruction: string;
        fleSizeInstruction: string;
      };
      pageDescription: string;
    };
    modelSummary: {
      pageTitle: string;
      form: {
        modelName: string;
        modelDescription: string;
        baseModel: string;
        datasetName: string;
        datasetId: string;
        openAerialImagery: string;
        zoomLevels: string;
        trainingSettings: string;
      };
      pageDescription: string;
    };
    confirmation: {
      buttons: {
        enhanceModel: string;
        goToModel: string;
        exploreModels: string;
      };
      description: string;
      updateDescription: string;
    };

    trainingSettings: {
      form: {
        zoomLevel: {
          label: string;
          toolTip: string;
        };
        trainingType: {
          label: string;
          toolTip: string;
        };
        advancedSettings: {
          label: string;
          toolTip: string;
        };
        epoch: {
          label: string;
          toolTip: string;
        };
        contactSpacing: {
          label: string;
          toolTip: string;
        };
        batchSize: {
          label: string;
          toolTip: string;
        };
        boundaryWidth: {
          label: string;
          toolTip: string;
        };
      };
      pageTitle: string;
      pageDescription: string;
    };
    progressStepper: {
      modelDetails: string;
      trainingDataset: string;
      trainingArea: string;
      trainingSettings: string;
      submitModel: string;
      confirmation: string;
    };
    progressButtons: {
      back: string;
      continue: string;
    };
  };
  models: {
    modelsList: {
      pageTitle: string;
      description: string;
      ctaButton: string;
      filtersSection: {
        searchPlaceHolder: string;
        mapViewToggleText: string;
      };
      sortingAndPaginationSection: {
        modelCountSuffix: string;
        sortingTitle: string;
      };
      modelCard: {
        accuracy: string;
        lastModified: string;
        baseModel: string;
      };
    };
    modelsDetailsCard: {
      datasetId: string;
      datasetName: string;
      modelId: string;
      detailsSectionTitle: string;
      createdBy: string;
      createdOn: string;
      lastModified: string;
      trainingId: string;
      propertiesSectionTitle: string;
      trainingHistorySectionTitle: string;
      enhanceModel: string;
      feedbacks: string;
      startMapping: string;
      modelDescriptionNotAvailable: string;
      viewTrainingArea: string;
      viewFeedbacks: string;
      modelFiles: string;
      properties: {
        zoomLevels: {
          title: string;
          tooltip: string;
        };
        epochs: {
          title: string;
          tooltip: string;
        };
        contactSpacing: {
          title: string;
          tooltip: string;
        };
        currentDatasetSize: {
          title: string;
          tooltip: string;
        };
        baseModel: {
          title: string;
          tooltip: string;
          href: {
            RAMP: string;
            YOLO_V8_V2: string;
            YOLO_V8_V1: string;
          };
        };
        sourceImage: {
          title: string;
          tooltip: string;
        };
        trainingId: {
          title: string;
          tooltip: string;
        };

        batchSize: {
          title: string;
          tooltip: string;
        };
        accuracy: {
          title: string;
          tooltip: string;
        };
        boundaryWidth: {
          title: string;
          tooltip: string;
        };
      };
      trainingHistoryTableHeader: {
        trainingHistoryCount: string;
        id: string;
        epochAndBatchSize: string;
        startedAt: string;
        sumittedBy: string;
        model: string;
        duration: string;
        dsSize: string;
        accuracy: string;
        status: string;
        info: string;
        action: string;
        inUse: string;
      };
      modelFilesDialog: {
        rootDirectory: string;
        dialogTitle: string;
        dialogDescription: string;
        error: string;
      };
      trainingInfoDialog: {
        status: string;
        logs: string;
      };
      modelUpdate: {
        dialogHeading: string;
        editButtonText: string;
        saveButtonText: string;
      };
      trainingSettings: {
        dialogHeading: string;
        description: string;
        submitButtonText: string;
      };
      modelEnhancement: {
        dialogHeading: string;
        newSettings: {
          title: string;
          description: string;
        };
        trainingData: {
          title: string;
          description: string;
        };
      };
    };
  };
};

// Models related pages content types ends.

// Shared pages content types start.

export type TSharedContent = {
  navbar: {
    logoAlt: string;
    loginButton: string;
    hamburgerMenuAlt: string;
    hamburgerMenuTitle: string;
    routes: {
      exploreModels: string;
      about: string;
      resources: string;
      learn: string;
    };
    userProfile: {
      profile: string;
      datasets: string;
      models: string;
      settings: string;
      logout: string;
    };
  };
  footer: {
    title: string;
    copyright: {
      firstSegment: string;
      secondSegment: string;
    };
    socials: {
      ctaText: string;
    };
    madeWithLove: {
      firstSegment: string;
      secondSegment: string;
      thirdSegment: string;
      fourthSegment: string;
    };
  };
  homepage: {
    jumbotronTitle: string;
    jumbotronHeadline: string;
    ctaPrimaryButton: string;
    ctaSecondaryButton: string;
    jumbotronImageAlt: string;
    kpi: {
      publishedAIModels: string;
      totalUsers: string;
      humanFeedback: string;
      acceptedPrediction: string;
    };
    aboutTitle: string;
    aboutContent: string;
    fairProcess: {
      title: string;
      stepOne: {
        title: string;
        description: string;
      };
      stepTwo: {
        title: string;
        description: string;
      };
      stepThree: {
        title: string;
        description: string;
      };
      stepFour: {
        title: string;
        description: string;
      };
    };
    coreFeatures: {
      featureOne: string;
      featureTwo: string;
      featureThree: string;
    };
    coreValues: {
      sectionTitle: {
        firstSegment: string;
        secondSegment: string;
        thirdSegment: string;
        fourthSegment: string;
        fifthSegment: string;
      };
      community: {
        title: string;
        description: string;
      };
      humansNotReplaced: {
        title: string;
        description: string;
      };
    };
    faqs: {
      sectionTitle: string;
      cta: string;
      content: [
        {
          question: string;
          answer: string;
        },
        {
          question: string;
          answer: string;
        },
        {
          question: string;
          answer: string;
        },
      ];
    };
    tagline: {
      firstSegment: string;
      secondSegment: string;
      thirdSegment: string;
      fourthSegment: string;
      fifthSegment: string;
    };
    callToAction: {
      title: string;
      ctaButton: string;
      ctaLink: string;
      paragraph: string;
    };
  };
  pageNotFound: {
    messages: {
      constant: string;
      modelNotFound: string;
      trainingDatasetNotFound: string;
      pageNotFound: string;
    };
    actionButtons: {
      modelNotFound: string;
      trainingDatasetNotFound: string;
      pageNotFound: string;
    };
  };
  protectedPage: {
    ctaButton: string;
    messageParagraph: string;
    messageTitle: string;
  };
  errorBoundary: {
    title: string;
    button: string;
  };
  construction: {
    message: string;
    button: string;
  };
  loginButtonLoading: string;
};

// Shared pages content types ends.

// Start mapping page content types starts.

export type TStartMappingPageContent = {
  pageTitle: (modelName: string) => string;
  map: {
    controls: {
      fitToBoundsControl: {
        tooltip: string;
      };
      legendControl: {
        toolTip: {
          show: string;
          hide: string;
        };
        title: string;
        acceptedPredictions: string;
        rejectedPredictions: string;
        predictionResults: string;
      };
      layerControl: {
        results: string;
      };
    };
    popup: {
      defaultTitle: string;
      commentTitle: string;
      accept: string;
      reject: string;
      resolve: string;
      comment: {
        description: string;
        placeholder: string;
        submit: string;
        submissionInProgress: string;
      };
      description: string;
    };
  };
  buttons: {
    runPrediction: string;
    tooltip: string;
    download: {
      label: string;
      options: {
        allFeatures: (prefix: string) => string;
        acceptedFeatures: (prefix: string) => string;
        openAllFeaturesInJOSM: string;
        openAcceptedFeaturesInJOSM: string;
      };
    };
    predictionInProgress: string;
  };
  settings: {
    useJOSMQ: {
      label: string;
      tooltip: string;
    };
    confidence: {
      label: string;
      tooltip: string;
    };
    tolerance: {
      label: string;
      tooltip: string;
    };
    area: {
      label: string;
      tooltip: string;
    };
    tooltip: string;
  };
  mapData: {
    title: string;
    accepted: string;
    rejected: string;
  };
  actions: {
    disabledModeTooltip: (p: string) => string;
  };
  modelDetails: {
    error: string;
    label: string;
    tooltip: string;
    popover: {
      title: string;
      modelId: string;
      description: string;
      lastModified: string;
      trainingId: string;
      datasetId: string;
      datasetName: string;
      zoomLevel: string;
      accuracy: string;
      baseModel: string;
    };
  };
  replicableModel: {
    apply: string;
    info: string;
    loading: string;
  };
};

// Start mapping page content types ends.

// Auth Page/Modal content starts.
export type TAuthPageAndModalContent = {
  pageTitle: string;
  title: string;
  instruction: string;
  buttonText: string;
  authInProgressText: string;
  emailVerificationInProgressText: string;
  emailVerificationPageTitle: string;
};

// Auth Page/Modal content ends.

// About page content types starts.

export type TAboutPageContent = {
  pageTitle: string;
  pageHeader: string;
  heroHeading: {
    firstSegment: string;
    secondSegment: string;
    thirdSegment: string;
  };
  imageAlt: string;
  bodyContent: {
    firstParagraph: string;
    secondParagraph: string;
  };
};

// About page content types ends.

// Learn page content types starts.

type TGuideBase = {
  title: string;
  description: string;
  icon: React.ComponentType<IconProps>;
  buttonText: string;
};

type TGuideWithOnClick = TGuideBase & {
  isVideo: true;
  onClick: () => void;
  isLink?: false;
  href?: never;
};
type TGuideWithLink = TGuideBase & {
  isLink: true;
  href: string;
  isVideo?: false;
  onClick?: never;
};

export type TGuide = TGuideWithOnClick | TGuideWithLink;
export type TVideo = {
  title: string;
  description: string;
  link: string;
};
export type TLearnPageContent = {
  pageTitle: string;
  pageHeader: string;
  heroHeading: {
    firstSegment: string;
    secondSegment: string;
    thirdSegment: string;
    fourthSegment: string;
    fifthSegment: string;
    sixthSegment: string;
    seventhSegment: string;
  };
  heroDescription: string;
  sectionHeaders: {
    guides: string;
    videos: string;
  };
  guides: TGuide[];
  videos: TVideo[];
};
// Learn page content types ends.

// Resources page content types starts.

export type TArticle = {
  image: string;
  title: string;
  snippet: string;
  link: string;
};
export type TResourcesPageContent = {
  pageTitle: string;
  pageHeader: string;
  hero: {
    firstSegment: string;
    secondSegment: string;
    thirdSegment: string;
  };
  faqs: {
    title: string;
    faqs: {
      question: string;
      answer: string;
    }[];
  };
  articles: {
    title: string;
    articles: TArticle[];
  };
};
// Resources page content types ends.

// Map content types starts.

export type TMapContent = {
  controls: {
    fitToBounds: {
      tooltip: string;
    };
  };
};

// Map content types end.

// User profile types starts.

export type TUserProfilePageContent = {
  overview: {
    pageTitle: string;
    dateJoinedPrefix: string;
    profileCompletionSuffix: string;
    profileCompletionSuccess: string;
    profileCompletionCTA: string;
    trainingsSectionTitle: string;
    statistics: {
      modelsCreated: string;
      acceptedFeaturesTitle: string;
      datasets: string;
      feedbacks: string;
    };
  };
  models: {
    pageTitle: string;
    sectionTitle: string;
    createNewButtonText: string;
  };
  datasets: {
    pageTitle: string;
    sectionTitle: string;
  };
  settings: {
    pageTitle: string;
    form: {
      sectionHeading: string;
      emailAddressSectionHeading: string;
      placeholder: string;
      formLabel: string;
      editEmail: string;
      submitButton: string;
      submissionInProgress: string;
      emailVerifiedTooltip: string;
      emailNotVerifiedMessage: string;
      verifyEmailButtonText: string;
    };
    notifications: {
      sectionTitle: string;
      notificationKeys: {
        monthlyNewsletter: string;
        emailTrainingNotification: string;
        webTrainingNotification: string;
      };
      notificationTypes: {
        label: string;
        key: string;
        description: string;
      }[];
    };
    account: {
      sectionTitle: string;
      title: string;
      description: string;
      deleteRequestPending: string;
      deleteButtonText: string;
      deleteModal: {
        title: string;
        messageSuffix: string;
        deletionSuccessTitle: string;
        deletionSuccessDescription: string;
        buttonText: string;
      };
    };
  };
  notifications: {
    panelTitle: string;
    all: string;
    unread: string;
    markAsRead: string;
    markAllAsRead: string;
    emptyState: string;
    errorState: string;
    toolTip: string;
  };
};

// User profile types ends.
