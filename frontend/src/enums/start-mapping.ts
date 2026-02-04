import { BASE_MODELS } from "./common";

export enum PredictionImagerySource {
  ModelDefault = "Model's Default",
  CustomImagery = "Custom Imagery",
  GoogleSatellite = "Google Satellite",
  Kontour = "OpenAerialMap Mosaic",
}

export const PredictionModel = {
  DEFAULT: "Default",
  CUSTOM: "Custom",
  ...BASE_MODELS,
};

export enum PredictedFeatureStatus {
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  UNTOUCHED = "untouched",
}

export enum FeedbackType {
  ACCEPT = "ACCEPT",
  REJECT = "REJECT",
}

export enum MapMode {
  ONLINE = "online",
  // This is enabled when the user is trying to draw an AOI for prediction requests.
  OFFLINE = "offline",
}
