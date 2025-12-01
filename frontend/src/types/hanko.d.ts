// Type declarations for HOTOSM Auth web component
declare namespace JSX {
  interface IntrinsicElements {
    "hotosm-auth": {
      "hanko-url"?: string;
      "base-path"?: string;
      "show-profile"?: string | boolean;
      "redirect-after-login"?: string;
      "redirect-after-logout"?: string;
      "osm-required"?: string | boolean;
      "auto-connect"?: string | boolean;
    };
  }
}
