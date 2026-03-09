/// <reference types="vite/client" />

import type React from "react";

// JSX IntrinsicElements for custom web components
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends IntrinsicElements {
      "hotosm-auth": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "hanko-url"?: string;
        "base-path"?: string;
        "show-profile"?: string | boolean;
        "redirect-after-login"?: string;
        "redirect-after-logout"?: string;
        "osm-required"?: string | boolean;
        "auto-connect"?: string | boolean;
        "verify-session"?: string | boolean;
        "mapping-check-url"?: string;
        "app-id"?: string;
        "button-variant"?: string;
        "button-color"?: string;
        display?: string;
      };
      "hotosm-tool-menu": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
