import { FAIR_DOCS_URL } from "@/constants/routes";
import { TSharedContent } from "@/types";

export const SHARED_CONTENT: TSharedContent = {
  navbar: {
    logoAlt: "fAIr logo",
    loginButton: "Start Mapping",
    /** The sign-in button in the mobile menu. */
    mobileLoginButton: "Login",
    hamburgerMenuAlt: "Hamburger Menu Icon",
    hamburgerMenuTitle: "Toggle Menu",
    routes: {
      exploreModels: "Explore Models",
      exploreDatasets: "Datasets",
      about: "About",
      resources: "Resources",
      learn: "Learn",
    },
    userProfile: {
      profile: "My Profile",
      datasets: "My Datasets",
      models: "My Models",
      settings: "Settings",
      logout: "Log Out",
      offlinePredictions: "Prediction Requests",
    },
  },
  footer: {
    title:
      "We pursue Just tech to amplify connections between human[itarian] needs and open map data.",
    copyright: {
      firstSegment:
        "Screenshots of fAIr may be shared under a Creative Commons Attribution-ShareAlike 4.0 International License.",
      secondSegment:
        "Free and open-source software, started by the Humanitarian OpenStreetMap Team and built with community.",
    },
    socials: {
      ctaText: "Learn more about OpenStreetMap.",
    },
    supportedBy: "Supported by",
    madeWithLove: {
      firstSegment: "Made with",
      heartLabel: "love",
      connector: "by",
      secondSegment: "HOT",
      thirdSegment: "&",
      fourthSegment: "friends",
    },
  },
  homepage: {
    jumbotronTitle: "Your AI Mapping Partner",
    jumbotronHeadline:
      "Find and trace objects in aerial imagery with open geo-AI models.",
    ctaPrimaryButton: "Try fAIr",
    ctaSecondaryButton: "Start Mapping",
    jumbotronImageAlt: "A user engaging in a mapping activity",
    kpi: {
      baseModels: "Base models",
      localModels: "Local models",
      trainingDatasets: "Training datasets",
      areasPredicted: "Areas predicted",
      registeredUsers: "Registered users",
    },
    aboutTitle: "WHAT IS fAIr?",
    aboutContent: `fAIr is a shared collection of open geo-AI models that find features such as buildings and trees in aerial imagery. It was started by the Humanitarian OpenStreetMap Team and is built with community. Models, training data and validated results are published openly.`,
    fairProcess: {
      title: "fAIr process",
      stepOne: {
        title: "Pick a model",
        description: "Choose one from the shared collection.",
      },
      stepTwo: {
        title: "Run it",
        description: "Run it on your area, on the map or as a map request.",
      },
      stepThree: {
        title: "Validate",
        description:
          "Check each result in fAIr, at scale in MapSwipe, or on the ground.",
      },
      stepFour: {
        title: "Adapt",
        description: "Fine-tune it with checked results and local data.",
      },
      stepFive: {
        title: "Use the data",
        description: "Download the results, or use HOT's open data layers.",
      },
    },
    coreFeatures: {
      featureOne: "Open",
      featureTwo: "Transparent",
      featureThree: "Local",
      featureFour: "Reusable",
    },
    coreValues: {
      sectionTitle: {
        firstSegment: "Open models and",
        secondSegment: "map data,",
        thirdSegment: "validated",
        fourthSegment: "by",
        fifthSegment: "people",
      },
      community: {
        title: "Community Driven",
        description:
          "Community mappers create training data through the Open Mapping Gurus program and fAIrSwipe.",
      },
      humansNotReplaced: {
        title: "Humans in the loop",
        description: "Predictions are suggestions for a mapper to review.",
      },
    },
    faqs: {
      sectionTitle: "faqs",
      cta: "See more",
      content: [
        {
          question: "Where can I find the fAIr documentation?",
          answer: `The [fAIr documentation](${FAIR_DOCS_URL}) explains how fAIr works, its models and datasets, and how to contribute.`,
        },
        {
          question: "Who is fAIr for?",
          answer: `People meet fAIr at different levels:
- Mappers pick a model, run it over their area and check the results.
- Advanced users fine-tune a model for their area and publish the local model.
- Model developers add new models for everyone to use.`,
        },
        {
          question: "What does the workflow look like?",
          answer:
            "[Read how fAIr works](https://hotosm.github.io/fAIr/overview/how-it-works/)",
        },
        {
          question: "Do I need high-res imagery? Will Sentinel work?",
          answer:
            "fAIr needs openly licensed, very high-resolution RGB imagery, ideally hosted on OpenAerialMap or a public TMS server. The buildings model expects about 30 to 50 cm per pixel, so 10 m Sentinel-2 imagery is too coarse.",
        },
        {
          question: "How do I validate its output? I don't trust AI.",
          answer:
            "You get the results as GeoJSON, so you can also verify them on the ground with FieldTM or fix them by hand in QGIS.",
        },
        {
          question: "Can I add my own model?",
          answer:
            "Yes. Developers contribute model code through a pull request to fAIr-models; once it is reviewed and registered, anyone can run it.",
        },
        {
          question: "How is fAIr used responsibly?",
          answer:
            "Each model card reports its evaluation metrics, each model states its license, and model outputs are validated by people before they are used. See [Responsible use](https://hotosm.github.io/fAIr/overview/what-is-fair/#responsible-use).",
        },
        {
          question: "Does fAIr add its data to OpenStreetMap?",
          answer:
            "No. HOT publishes validated outputs as open data layers. See [fAIr and OpenStreetMap](https://hotosm.github.io/fAIr/overview/what-is-fair/#fair-and-openstreetmap).",
        },
      ],
    },
    tagline: {
      firstSegment: "Built",
      secondSegment: "with",
      thirdSegment: "mappers,",
      fourthSegment: "for",
      fifthSegment: "mappers",
    },
    callToAction: {
      title: "Join the fAIr community",
      ctaButton: "Join The Community",
      ctaLink: "https://slack.hotosm.org",
      paragraph: "Anyone can join the conversation on the HOT Slack.",
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
