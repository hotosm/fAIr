import { TResourcesPageContent } from "@/types";

export const RESOURCES_PAGE_CONTENT: TResourcesPageContent = {
  pageTitle: "Resources",
  pageHeader: "Resources",
  hero: {
    firstSegment: "Lorem ipsum dolor sit amet,",
    secondSegment: "consectetur adipiscing elit,",
    thirdSegment: "sed do eiusmod tempor incididunt",
  },
  faqs: {
    title: "faqs",
    faqs: [
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
  articles: {
    title: "Articles",
    articles: [
      {
        image: "https://cdn.hotosm.org/website/fAIr.png",
        title: "hot_tech_talk | fAIr: AI-assisted mapping",
        snippet: `Here is all you need to know about HOT's open AI-assisted mapping service: fAIr.`,
        link: "https://www.hotosm.org/tech-blog/hot-tech-talks-fair/",
      },
      {
        image:
          "https://www.hotosm.org/uploads/Screenshot%202023-12-21%20at%2010.01.26%E2%80%AFAM-b628cd.png",
        title: "fAIr - what to expect in 2024!",
        snippet: `Learn about the most recent updates on HOT's AI-assisted mapping service (fAIr) and what to expect in 2024!`,
        link: "https://www.hotosm.org/updates/fAIr_2024/",
      },
    ],
  },
};
