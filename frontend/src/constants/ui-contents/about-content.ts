import { TAboutPageContent } from "@/types";

export const ABOUT_PAGE_CONTENT: TAboutPageContent = {
  pageTitle: "About",
  pageHeader: "About",
  heroHeading: {
    firstSegment: "fAIr is an open",
    secondSegment: "AI-assisted mapping platform",
    thirdSegment: "developed by the Humanitarian OpenStreetMap Team (HOT)",
  },
  imageAlt: "HOT Team",
  bodyContent: {
    firstParagraph: `fAIr puts control of the AI models and training directly at the hands of the mappers that use them for better and faster data creation`,
    secondParagraph: `HOT sees that mappers can, on average, map between 1000-1500 buildings per working day without AI assistance. During an AI-assisted mapping pilot (2019-2020) supported by Microsoft, 18 million building footprints were extracted from satellite imagery for all of Tanzania and Uganda. HOT discovered during this pilot that this average mapping nearly doubled to 2500-3000 buildings being added to OSM per day with the assistance of high-quality AI open-source datasets. `,
  },
};
