import type { StepType } from "@reactour/tour";

export const APP_TOUR_IDS = {
  STEP_HEADING: "step-heading",
  PROGRESS_BUTTONS: "progress-buttons",
  FETCH_OSM_DATA: "fetch-osm-data",
  DRAW_TRAINING_AREA: "draw-training-area",
  MORE_INFORMATION: "more-information",
  TUTORIAL_BUTTON: "tutorial-button",
  TRAINING_AREA_TOOLS: "training-area-tools",
  TRY_FAIR_PARAMETERS: "try-fair-parameters",
  TRY_FAIR_MAP_BUTTON_TOOLTIP: "try-fair-map-button-tooltip",
  TRY_FAIR_START_MAPPING_BUTTON: "try-fair-start-mapping-button",
  TRY_FAIR_DOWNLOAD_PREDICTIONS_BUTTON: "try-fair-download-predictions-button"
};

export const APP_TOUR_STEPS = [
  {
    selector: `#${APP_TOUR_IDS.DRAW_TRAINING_AREA}`,
    content:
      "Define a training area on the map. This area will be used for model training.",
    position: "top",
  },
  {
    selector: `#${APP_TOUR_IDS.TRAINING_AREA_TOOLS}`,
    content:
      "Hover on each tool to see its function. Use the tools to modify the training area.",
  },
  {
    selector: `#${APP_TOUR_IDS.FETCH_OSM_DATA}`,
    content:
      "Fetch OpenStreetMap (OSM) data to use as labels for training. Ensure the data is relevant to your training area.",
  },
  {
    selector: `#${APP_TOUR_IDS.MORE_INFORMATION}`,
    content:
      "Access additional options and details about the training area by clicking this icon.",
  },
  {
    selector: `#${APP_TOUR_IDS.TUTORIAL_BUTTON}`,
    content: "Restart the tour at any time by clicking this button.",
  },
  
];

// Hide the dimming mask so the map stays visible/interactive during the tour.
const hideMask = () => ({ display: "none" });
const popoverStyle = (base: any) => ({
  ...base,
  maxWidth: "280px",
  borderRadius: "6px",
  "--reactour-accent": "#d63f40",
});

/**
 * The guided "how it works" tour, launched from the Help button.
 */
export const getTryFairGuidedTourSteps = (
  isSmallViewport: boolean,
): StepType[] => [
  {
    selector: `#${APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP}`,
    content: "Click Map to run a prediction over the highlighted grid.",
    position: isSmallViewport ? "top" : "right",
    styles: {
      popover: popoverStyle,
      maskWrapper: hideMask,
    },
  },
  {
    selector: `#${APP_TOUR_IDS.TRY_FAIR_PARAMETERS}`,
    content:
      "Adjust confidence and resolution to explore how prediction output changes.",
    position: isSmallViewport ? "top" : "bottom",
    styles: {
      popover: popoverStyle,
      maskWrapper: hideMask,
    },
  },
  {
    selector: `#${APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP}`,
    content: "Click Map again to re-run the prediction with your new settings.",
    position: isSmallViewport ? "top" : "right",
    styles: {
      popover: popoverStyle,
      maskWrapper: hideMask,
    },
  },
  {
    selector: `#${APP_TOUR_IDS.TRY_FAIR_DOWNLOAD_PREDICTIONS_BUTTON}`,
    content: "Click here to download prediction data generated from the output you selected.",
    position: isSmallViewport ? "top" : "bottom",
    styles: {
      popover: (base: any) => ({
        ...popoverStyle(base),
        marginTop: "40px",
      }),
      maskWrapper: hideMask,
    },
  },
];

export const getTryFairStartMappingStep = (): StepType => ({
  selector: `#${APP_TOUR_IDS.TRY_FAIR_START_MAPPING_BUTTON}`,
  content:
    "Ready for full mapping? Click Start Mapping to access advanced tools.",
  styles: {
    close: (base) => ({ ...base, right: 12, top: 12 }),
    maskWrapper: hideMask,
    navigation: (base) => ({ ...base, display: "none" }),
    badge: (base) => ({ ...base, display: "none" }),
    arrow: (base) => ({ ...base, display: "none" }),
  },
});
