// Models related pages content types starts.

import { IconProps } from "./common";

export type TModelsPagesContent = {
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
};

// Models related pages content types ends.

// Start mapping page content types starts.

export type TStartMappingPageContent = {
  pageTitle: (modelName: string) => string;
  map: {
    controls: {
      fitToBoundsControl: {
        tooltip: string;
      };
      legendControl: {
        title: string;
        acceptedPredictions: string;
        rejectedPredictions: string;
        predictionResults: string;
      };
      layerControl: {
        acceptedPredictions: string;
        rejectedPredictions: string;
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
        allFeatures: string;
        acceptedFeatures: string;
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
};

// Start mapping page content types ends.

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
