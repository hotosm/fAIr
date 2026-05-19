import { TSharedContent } from "@/types";

export const SHARED_CONTENT: TSharedContent = {
  navbar: {
    logoAlt: "HOT fAIr Logo",
    loginButton: "Start Mapping",
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
  },
  homepage: {
    jumbotronTitle: "Your AI Mapping Partner",
    jumbotronHeadline:
      "AI-powered assistant that amplify your mapping efforts intelligently and quickly, helping you map smarter and faster.",
    ctaPrimaryButton: "Try fAIr",
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
    baseModelCTA: {
      title: "Contribute Your Base Model",
      description:
        "Contribute a base model to fAIr and help teams turn imagery into actionable map data, faster and more reliably.",
      ctaButton: "Contribute",
      ctaLink: "/base-models",
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
  baseModelsPage: {
    pageHeadingTitle: "Base Models",
    pageHeadingDescription:
      " Each model is trained using one of the training datasets. Published models can be used to find mappable features in imagery that is similar to the training areas that dataset comes from.",
    pageHeadingButtonText: "Contribute model",
    contributeModelDialog: {
      label: "Model Contribution Journey",
      intro:
        "Model contribution into fAIr is handled in GITHUB /fAIr-models repository. Here are high level explanation for the contribution four steps and detailed documentation is available when you go to GITHUB",
      github: {
        title: "Fair Model github",
        href: "https://github.com/hotosm/fAIr-models",
        buttonLabel: "GO TO GITHUB",
      },
      steps: [
        {
          title: "Complete Prerequisites",
          description:
            "Before opening a Pull Request, verify your model meets the technical and legal standards.",
          sections: [
            {
              title: "Define Licenses",
              description:
                "AI models require three distinct licenses. You must select one for each category:",
              listType: "unordered",
              items: [
                "Code License: (e.g., Apache 2.0, MIT, or GPLv3)",
                "Weights License: (e.g., Apache 2.0, CC BY 4.0, or Custom)",
                "Data License: (e.g., CC BY, CC BY-NC, or Custom Terms)",
              ],
              note: "Note: This will be automatically validated if your selections are HOT-compliant to prevent future rejection.",
            },
            {
              title: "Verify Model Endpoints",
              description:
                "Ensure your model code includes the four mandatory API endpoints:",
              listType: "ordered",
              items: [
                "Training: For model fine-tuning.",
                "Inference: For generating predictions.",
                "Preprocessing: For imagery preparation.",
                "Postprocessing: For cleaning and formatting results.",
              ],
            },
            {
              title: "Define Input/Output Shape",
              description:
                "Clearly describe the data formats your model handles.",
              listType: "unordered",
              items: [
                "Input Example: Image RGB (tiles) + GeoJSON (labels)",
                "Output Example: GeoJSON (detections) or Mask raster (segmentation)",
              ],
            },
            {
              title: "Select Task Category",
              description: "Choose one of the currently supported tasks:",
              listType: "unordered",
              items: [
                "Semantic Segmentation",
                "Instance Segmentation",
                "Object Detection (Selected for this session)",
              ],
            },
          ],
        },
        {
          title: "Review Guidelines",
          description:
            "To align with our community standards, you must read and acknowledge the contribution rules.",
        },
        {
          title: "Submit and Track PR",
          description:
            "After reviewing the guidelines and finished the prerequisites, you can now open a PR.",
        },
        {
          title: "Approval & Deployment",
          description:
            "Your contribution enters the final review stage by the fAIr maintainers.",
          statuses: [
            {
              variant: "pending",
              label: "🟡 Pending",
              description: "Under review by maintainers or CI is running.",
            },
            {
              variant: "changes",
              label: "🔴 Needs Changes",
              description: "Feedback has been provided; updates are required.",
            },
            {
              variant: "approved",
              label: "🟢 Approved",
              description: "PR is merged! Your model is now a fAIr base model.",
            },
          ],
        },
      ],
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
