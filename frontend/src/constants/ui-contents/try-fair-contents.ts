import { TTryFairPageContent } from "@/types";

export const TRY_FAIR_PAGE_CONTENT: TTryFairPageContent = {
  pageTitle: "Try fAIr - Your AI Mapping Partner",
  header: {
    logoAlt: "fAIr logo",
    startMappingButton: "Start Mapping",
  },
  sidebar: {
    modelSelector: {
      placeholder: "Select a model",
    },
    mapButton: "Map",
    mapButtonRunning: "Mapping...",
    mapOutput: {
      label: "Map Output",
    },
    parameters: {
      label: "Parameters",
      description:
        "Adjust size and accuracy to explore different prediction results.",
      learnMore: "Learn more",
      resolution: {
        label: "Size",
        low: "Low",
        mid: "Mid",
        high: "High",
      },
      confidence: {
        label: "Confidence",
      },
    },
  },
  modelPicker: {
    title: "What do you want to map",
    modelLabel: "Model: ",
    byLabel: "By: ",
  },
  map: {
    zoomPrompt: "Zoom in further to run predictions.",
  },
};
