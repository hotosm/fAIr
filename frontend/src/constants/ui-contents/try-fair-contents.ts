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
      label: "SETTINGS",
      description:
        "Adjust confidence and resolution to explore different prediction results.",
      learnMore: "Learn more",
      resolution: {
        label: "Resolution",
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
