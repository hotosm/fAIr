export enum BASE_MODELS {
  RAMP = "RAMP",
  YOLOV8_V1 = "YOLO_V8_V1",
  YOLOV8_V2 = "YOLO_V8_V2",
}

export enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DARK = "dark",
  DEFAULT = "default",
  TERTIARY = "tertiary",
  NONE = "none",
}

export enum TrainingType {
  BASIC = "Basic",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export enum TrainingDatasetOption {
  CREATE_NEW = "Create New",
  USE_EXISTING = "Select Existing",
}

export enum DrawingModes {
  RECTANGLE = "rectangle",
  POLYGON = "polygon",
  SELECT = "select",
  STATIC = "static",
}

export enum ToolTipPlacement {
  RIGHT = "right",
  BOTTOM = "bottom",
  TOP = "top",
  LEFT = "left",
}

export enum BASEMAPS {
  OSM = "OSM",
  GOOGLE_SATELLITE = "Google Satellite",
}

export enum INPUT_TYPES {
  DATE = "date",
  TEXT = "text",
  NUMBER = "number",
  URL = "url",
  EMAIL = "email",
}

export enum SHOELACE_SELECT_SIZES {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

export enum SHOELACE_SIZES {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  EXTRA_LARGE = "extra-large",
}

export enum DrawerPlacements {
  BOTTOM = "bottom",
  TOP = "top",
  END = "end",
}

export enum DropdownPlacement {
  BOTTOM_START = "bottom-start",
  BOTTOM_END = "bottom-end",
  TOP_END = "top-end",
}

export enum ModelTrainingStatus {
  SUBMITTED = "SUBMITTED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

export enum TileServiceType {
  XYZ = "XYZ",
  TMS = "TMS",
  TILEJSON = "TileJSON",
  ESRI = "ESRI",
}
