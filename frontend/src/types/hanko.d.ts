// Type declarations for HOTOSM Auth web component

// Module declaration for auth-libs
declare module '@AuthLibs/web-component/dist/hanko-auth.esm.js';

// JSX IntrinsicElements for hotosm-auth custom web component
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hotosm-auth': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'hanko-url'?: string;
        'base-path'?: string;
        'show-profile'?: string | boolean;
        'redirect-after-login'?: string;
        'redirect-after-logout'?: string;
        'osm-required'?: string | boolean;
        'auto-connect'?: string | boolean;
        'verify-session'?: string | boolean;
      };
    }
  }
}
