/**
 * The environment variables. Ideally these values should be set in the .env file.
 */
export const ENVS = {
    REACT_APP_BASE_API_URL: import.meta.env.VITE_BASE_API_URL,
    MATOMO_ID: import.meta.env.VITE_MATOMO_ID,
    APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN
}
