/**
 * The navigation routes for the application. This object controls the name of the path. i.e  /<pathname>
 */

import { TProfileNavigationTabs } from "@/types";

export const MODELS_BASE = "/ai-models";

export const MODELS_ROUTES = {
  // Creation Routes
  CREATE_MODEL_BASE: `${MODELS_BASE}/new`,
  // Editing Routes
  EDIT_MODEL_BASE: `${MODELS_BASE}/:modelId`,
  DETAILS: "details",
  TRAINING_DATASET: "training-dataset",
  TRAINING_AREA: "training-area",
  TRAINING_SETTINGS: "training-settings",
  CONFIRMATION: "confirmation",
  MODEL_SUMMARY: "model-summary",
};

export const APPLICATION_ROUTES = {
  HOMEPAGE: "/",
  MODELS: MODELS_BASE,
  MODEL_FEEDBACKS_BASE_ROUTE: "feedbacks",
  MODEL_DETAILS: `${MODELS_BASE}/:id`,
  MODEL_FEEDBACKS: `${MODELS_BASE}/:id/feedbacks`,

  // Model routes start

  CREATE_NEW_MODEL: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.DETAILS}`,
  CREATE_NEW_MODEL_TRAINING_DATASET: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_DATASET}`,
  CREATE_NEW_MODEL_CONFIRMATION: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.CONFIRMATION}`,
  CREATE_NEW_MODEL_TRAINING_AREA: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_AREA}`,
  CREATE_NEW_MODEL_TRAINING_SETTINGS: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.TRAINING_SETTINGS}`,
  CREATE_NEW_MODEL_SUMMARY: `${MODELS_ROUTES.CREATE_MODEL_BASE}/${MODELS_ROUTES.MODEL_SUMMARY}`,

  EDIT_MODEL_DETAILS: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.DETAILS}`,
  EDIT_MODEL_TRAINING_DATASET: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_DATASET}`,
  EDIT_MODEL_CONFIRMATION: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.CONFIRMATION}`,
  EDIT_MODEL_TRAINING_AREA: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_AREA}`,
  EDIT_MODEL_TRAINING_SETTINGS: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.TRAINING_SETTINGS}`,
  EDIT_MODEL_SUMMARY: `${MODELS_ROUTES.EDIT_MODEL_BASE}/${MODELS_ROUTES.MODEL_SUMMARY}`,

  // Model routes end

  DATASETS: "/datasets",
  DATASET_DETAILS: "/datasets/:id",
  START_MAPPING_BASE: "/start-mapping/",
  START_MAPPING: "/start-mapping/:modelId",
  NOTFOUND: "/404",
  AUTH_CALLBACK: "/authenticate",
  EMAIL_VERIFICATION_CALLBACK: "/verify-email",
  PRIVACY_POLICY: "/privacy",
  LEARN: "/learn",
  ABOUT: "/about",
  RESOURCES: "/resources",
  PROFILE_BASE: "/profile",
  PROFILE_SETTINGS: "/profile/settings",
  PROFILE_MODELS: "/profile/models",
  PROFILE_DATASETS: "/profile/datasets",
};

export const HOT_PRIVACY_POLICY_URL: string = "https://www.hotosm.org/privacy";
/**
 * The navigation tabs used in the profile layout.
 */
export const PROFILE_NAVIGATION_TABS: TProfileNavigationTabs = [
  {
    title: "Overview",
    href: APPLICATION_ROUTES.PROFILE_BASE,
    active: true,
  },
  {
    title: "My Models",
    href: APPLICATION_ROUTES.PROFILE_MODELS,
    active: true,
  },
  {
    title: "My Datasets",
    href: APPLICATION_ROUTES.PROFILE_DATASETS,
    active: true,
  },
  {
    title: "Settings",
    href: APPLICATION_ROUTES.PROFILE_SETTINGS,
    active: true,
  },
];
