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
    jumbotronHeadline: "Map smarter and faster using AI assisted workflows.",
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
    aboutContent: `fAIr is HOT’s open GeoAI platform that connects mappers with GeoAI models they can use and adapt in their own areas for mapping for social good. Mappers can pick a model, run it. Adapt it to their locality and improve it.`,
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
      featureTwo: "Transparent",
      featureThree: "Reusable",
    },
    coreValues: {
      sectionTitle: {
        firstSegment: `It's`,
        secondSegment: "your map data,",
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
          question: "So what is fAIr?",
          answer:
            "A platform connecting mappers and AI models. It lets mappers find geo-AI models and use or adapt them in their own area. It is not a single AI doing the mapping.",
        },
        {
          question: "For whom is fAIr?",
          answer: `People meet fAIr at different levels:
- Model developers: can share and publish their models on fAIr
- Advanced Users: can finetune and republish localised models on fAIr
- Mapper: can pick a model and start mapping with AI`,
        },
        {
          question: "What does the workflow look like?",
          answer:
            "[View the workflow explainer](https://drive.google.com/file/d/14yGyEY_IxH5Na5XeK50TG3616PsWWUBB/view?usp=drive_lin)",
        },
        {
          question: "Do I need high-res imagery? Will Sentinel work?",
          answer:
            "fAIr only works with RGB high-res imagery (CC BY 4.0) at the moment. Imagery is crucial and should ideally be hosted on OpenAerialMap or a public-domain TMS server. In the future, we might support Street Level Imagery.",
        },
        {
          question: "How do I validate its output? I don't trust AI.",
          answer:
            "You will get the GeoJSON as output, and you have flexibility on what to use for validation. You can: confirm features in MapSwipe, verify on the ground with field mapping tools like Chatmap or Field TM or trace and fix manually in the mapping editors.",
        },
        {
          question: "Do I have to be an advanced user to start?",
          answer:
            "No. Begin as a mapper using a model someone already made. When you want it tuned to your area, you grow into adapting and publishing your own.",
        },
        {
          question: "Can I add my own model?",
          answer:
            "Yes. Developers write model code and publish it to fAIr, where it becomes available to every kind of user.",
        },
        {
          question: "Where does the finished data go?",
          answer:
            "It's your choice: You can bring it into OpenStreetMap or other open platforms like HDX, or download outputs as points, lines or polygons.",
        },
        {
          question: "Is merging with OSM data automatic?",
          answer:
            "No, not at the moment. fAIr doesn't push data to OSM; it's the user who decides what to do with it. We are working with MapSwipe on a project to assist with this.",
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
