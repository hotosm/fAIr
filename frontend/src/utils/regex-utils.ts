import { TileServiceType } from "@/enums";

// Matches valid XYZ tile server URLs.
export const XYZ_TILESERVER_URL_REGEX_PATTERN =
  /^https?:\/\/[^\/]+(?:\/[^\/]+)*\/\{z\}\/\{x\}\/\{y\}(?:@[0-9a-z]+)?(?:\.(jpg|png|jpeg|webp))?(?:\?.*)?$/i;

// Matches valid TMS tile server URLs.
export const TMS_TILESERVER_URL_REGEX_PATTERN =
  /^https?:\/\/[^\/]+(?:\/[^\/]+)*\/\{z\}\/\{x\}\/\{-y\}(?:@[0-9a-z]+)?(?:\.(jpg|png|jpeg|webp))?(?:\?.*)?$/i;

// Matches valid TileJSON URLs.
export const TILEJSON_TILESERVER_URL_REGEX_PATTERN =
  /^https?:\/\/[^\/]+(?:\/[^\/?#]+)*\/[^\/?#]+\.json(?:\?.*)?$/i;

// Allows letters, numbers, and spaces
export const VALID_CHARACTER_PATTERN = /^[a-zA-Z0-9\s]*$/;

// Matches valid model checkpoint URLs with .onnx or .tflite extensions.
export const VALID_MODEL_CHECKPOINT_PATH =
  /^https?:\/\/.*\/[^\/]+\.(onnx|tflite)\/?/;

// Matches valid OpenAerialMap tile server URLs.
export const OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN =
  /^https:\/\/tiles\.openaerialmap\.org\/[a-zA-Z0-9]+\/\d+\/[a-zA-Z0-9]+\/\{z\}\/\{x\}\/\{y\}$/;

/**
 *  Function to get the regular expression for a specific tile service type.
 *  This function returns a regular expression that matches the URL format for the specified tile service type.
 * @param serviceType - The type of tile service.
 * @returns  A regular expression that matches the URL format for the specified tile service type.
 */
export const getTileServerRegex = (serviceType: TileServiceType) => {
  switch (serviceType) {
    case TileServiceType.TILEJSON:
      return TILEJSON_TILESERVER_URL_REGEX_PATTERN;
    case TileServiceType.XYZ:
      return XYZ_TILESERVER_URL_REGEX_PATTERN;
    case TileServiceType.TMS:
      return TMS_TILESERVER_URL_REGEX_PATTERN;
    default:
      return XYZ_TILESERVER_URL_REGEX_PATTERN;
  }
};
