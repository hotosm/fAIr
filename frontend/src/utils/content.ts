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
      projects: "Projects",
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
      publishedAIModels:"Published AI Models",
      totalUsers:"Total Registered Users",
      humanFeedback: "Human Feedback"
    },
    aboutTitle: "WHAT IS fAIr?",
    aboutContent: `fAIr is an open AI-assisted mapping platform developed by the Humanitarian OpenStreetMap Team (HOT) that aims to improve the efficiency and accuracy of mapping efforts for humanitarian purposes. The service uses AI models, specifically computer vision techniques, to detect objects in satellite and UAV imagery.`,
    fairProcess: {
      stepOne: {
        title: "Create Model",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
      stepTwo: {
        title: "Run Prediction",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
      stepThree: {
        title: "Feedback",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
      stepFour: {
        title: "Use Data",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
    },
    coreFeatures: {
      featureOne: "Time Efficient",
      featureTwo: "High Accuracy",
      featureThree: "Time Efficient",
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
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
      humansNotReplaced: {
        title: "Humans not Replaced",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      },
    },
    faqs: {
      sectionTitle: "faqs",
      cta: "See more",
      content: [
        {
          question: "What is fAIr?",
          answer:
            " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
        {
          question: "Who can use fAIr?",
          answer:
            " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
        {
          question: "Can I use fAIr without having a sound knowledge of AI?",
          answer:
            " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
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
      paragraph:
        " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Fugiat esse ipsam amet molestias impedit at nulla fuga, sed ducimus nesciunt dolore facere cum velit voluptatem provident reiciendis iure quo rerum.",
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
    message: 'This page is under construction. Please check back.',
    button: 'Go home'
  },
  loginButtonLoading: 'Logging in...',
  toasts: {
    authenticationFailed: 'Login failed.',
    loginSuccess: 'Login successful.',
    logoutSuccess: 'Logout successful.'
  }
};
