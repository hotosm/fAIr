import { TAboutPageContent } from "@/types";

export const ABOUT_PAGE_CONTENT: TAboutPageContent = {
  pageTitle: "About",
  pageHeader: "About",
  heroHeading: {
    firstSegment: "fAIr is a shared collection of",
    secondSegment: "open geo‑AI models",
    thirdSegment: "that people run, check and adapt to their own area",
  },
  imageAlt: "Participants at a HOT Summit",
  bodyContent: {
    firstParagraph:
      "Local first: a model can be fine-tuned for the place where it is used, on examples mapped by community mappers in that area. Open and shared: models, training datasets and validated results are published openly, so the next community can start from them. Accessible: anyone can run a model in the browser and check each result.",
    secondParagraph:
      "Mappers run a model on their area and check the results in fAIr, at scale in MapSwipe, or on the ground. Advanced users fine-tune a model for their area and publish it back, and developers add new models. Each model states its license; labels are shared under the ODbL and imagery tiles under CC BY 4.0. fAIr was started by the Humanitarian OpenStreetMap Team and is built with community.",
  },
  documentationLink: "Read the fAIr documentation",
};
