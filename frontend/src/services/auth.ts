import { API_ENDPOINTS } from "@/services/api-routes";
import { apiClient } from "@/services/api-client";
import { showErrorToast } from "@/utils";
import { TAuthenticate, TLogin, TUser } from "@/types/api";

/**
 * This class encapsulate the various authentication services.
 */
class AuthService {
  // Inspired by https://github.com/hotosm/tasking-manager/blob/develop/frontend/src/utils/login.js
  private async createPopUp(url: string): Promise<Window | null> {
    const width = 500;
    const height = 630;
    const settings = [
      `width=${width}`,
      `height=${height}`,
      `left=${window.innerWidth / 2 - width / 2}`,
      `top=${window.innerHeight / 2 - height / 2}`,
      "resizable=no",
      "scrollbars=yes",
      "status=no",
    ].join(",");

    const popup = window.open(url, "_parent", settings);

    if (!popup) return null;
    return popup;
  }
  /**
   * Retrieve the oauth login_url from the backend.
   * @returns
   */
  private async getOAuthURL(): Promise<TLogin> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LOGIN);
      const oauthUrl: TLogin = await response.data;
      return oauthUrl;
    } catch (error) {
      showErrorToast(undefined, "Failed to get OAuth URL");
      throw new Error("Unable to retrieve login URL.");
    }
  }
  /**
   * Initialize the oauth flow after the user clicks the login button.
   * It opens a popup/or a new tab, and after the authorization with OSM, it appends the code and token to the parent window.
   * @returns
   */
  async initializeOAuthFlow(): Promise<void> {
    try {
      const oauthUrl = await this.getOAuthURL();
      const popup = await this.createPopUp(oauthUrl.login_url);
      if (!popup) {
        throw new Error("Popup blocked or not created.");
      }
    } catch (error) {
      showErrorToast(undefined, "OAuth flow initialization failed");
      throw error;
    }
  }

  /**
   * Note this is a protected endpoint but the access_token is updated in the auth provider globally on the axios instance.
   * @returns The user object.
   */
  async getUser(): Promise<TUser> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER);
      return response.data;
    } catch (error) {
      showErrorToast(undefined, "Failed to fetch user data");
      throw new Error("Unable to retrieve user data.");
    }
  }

  /**
   * @param state The state token retrieved from OSM.
   * @param code The code token retrieved from OSM.
   * @returns The access token from the backend.
   */
  async authenticate(state: string, code: string): Promise<TAuthenticate> {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}&state=${state}`,
      );
      return response.data;
    } catch (error) {
      showErrorToast(undefined, "Authentication failed");
      throw new Error("Failed to authenticate user.");
    }
  }
}

export const authService = new AuthService();
