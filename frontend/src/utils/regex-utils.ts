import { TileServiceType } from "@/enums";

// Matches valid XYZ tile server URLs.
export const XYZ_TILESERVER_URL_REGEX_PATTERN =
  /^https?:\/\/[^\/]+(?:\/[^\/]+)*\/\{z\}\/\{(x|y)\}\/\{(x|y)\}(?:@[0-9a-z]+)?(?:\.(jpg|png|jpeg|webp))?(?:\?.*)?$/i;

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
/**
 * Function to extract the YouTube video ID from a given URL.
 * This function matches common YouTube URL formats such as watch, embed, and short links.
 *
 * @param url - The YouTube URL to parse.
 * @returns The extracted 11-character YouTube video ID, or null if no match is found.
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  // Regex to match various YouTube URL formats
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/i;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};
/**
 * Function to get the tile server type from a given URL.
 * This function checks the URL against known patterns for different tile service types.
 * @param tileServiceURL - The URL of the tile service.
 * @returns The type of tile service if matched, otherwise null.
 */
export const getTileServerTypeFromURL = (
  tileServiceURL: string,
): TileServiceType => {
  if (TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(tileServiceURL)) {
    return TileServiceType.TILEJSON;
  }
  if (XYZ_TILESERVER_URL_REGEX_PATTERN.test(tileServiceURL)) {
    return TileServiceType.XYZ;
  }
  if (TMS_TILESERVER_URL_REGEX_PATTERN.test(tileServiceURL)) {
    return TileServiceType.TMS;
  }
  return TileServiceType.XYZ;
};
