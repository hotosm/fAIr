/**
 * The navigation routes for the application. This object controls the name of the path. i.e  /<pathname>
 */

export const APPLICATION_ROUTES = {
  HOMEPAGE: "/",
  MODELS: "/models",
  MODEL_DETAILS: '/models/:id',
  CREATE_NEW_MODEL: '/models/new',
  TRAINING_DATASETS: "/training-datasets",
  NOTFOUND: "/404",
  PRIVACY_POLICY: "/privacy",
  LEARN: "/learn",
  ABOUT: "/about",
  RESOURCES: "/resources",
  ACCOUNT_SETTINGS: '/account/settings',
  ACCOUNT_PROJECTS: '/account/projects'
};

export const HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY: string =
  "___hot_fAIr_access_token";

export const HOT_FAIR_SESSION_REDIRECT_KEY: string =
  "___hot_fAIr_redirect_after_login";

export const HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY = '__hot_fair_login_successful'