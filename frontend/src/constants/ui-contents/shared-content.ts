import { APPLICATION_ROUTES } from "../routes";
import { TSharedContent } from "@/types";

export const SHARED_CONTENT: TSharedContent = {
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
          isExternalLink: false,
        },
        {
          title: "privacy policy",
          route: "https://www.hotosm.org/privacy",
          isExternalLink: true,
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
};
