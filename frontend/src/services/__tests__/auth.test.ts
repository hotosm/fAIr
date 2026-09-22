// @ts-nocheck

import { describe, it, expect, vi, afterEach } from "vitest";
import { authService } from "../auth";
import { apiClient } from "@/services/api-client";
import { showErrorToast } from "@/utils";
import { API_ENDPOINTS } from "@/services/api-routes";

vi.mock("@/services/api-client");
vi.mock("@/utils");

describe("AuthService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOAuthURL", () => {
    it("should return the OAuth URL", async () => {
      const mockResponse = { data: { login_url: "http://example.com" } };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getOAuthURL();

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.LOGIN);
    });

    it("should show error toast and throw error on failure", async () => {
      apiClient.get.mockRejectedValue(new Error("Network Error"));

      await expect(authService.getOAuthURL()).rejects.toThrow(
        "Unable to retrieve login URL.",
      );
      expect(showErrorToast).toHaveBeenCalledWith(
        undefined,
        "Failed to get OAuth URL",
      );
    });
  });

  describe("initializeOAuthFlow", () => {
    it("should open a popup with the OAuth URL", async () => {
      const mockOAuthURL = { login_url: "http://example.com" };
      authService.getOAuthURL = vi.fn().mockResolvedValue(mockOAuthURL);
      window.open = vi.fn().mockReturnValue({});

      await authService.initializeOAuthFlow();

      expect(authService.getOAuthURL).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith(
        mockOAuthURL.login_url,
        "_parent",
        expect.any(String),
      );
    });

    it("should show error toast and throw error if popup is blocked", async () => {
      const mockOAuthURL = { login_url: "http://example.com" };
      authService.getOAuthURL = vi.fn().mockResolvedValue(mockOAuthURL);
      window.open = vi.fn().mockReturnValue(null);

      await expect(authService.initializeOAuthFlow()).rejects.toThrow(
        "Popup blocked or not created.",
      );
      expect(showErrorToast).toHaveBeenCalledWith(
        undefined,
        "OAuth flow initialization failed",
      );
    });
  });

  describe("getUser", () => {
    it("should return the user data", async () => {
      const mockResponse = { data: { id: 1, name: "John Doe" } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getUser();

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.USER);
    });

    it("should show error toast and throw error on failure", async () => {
      apiClient.get.mockRejectedValue(new Error("Network Error"));

      await expect(authService.getUser()).rejects.toThrow(
        "Unable to retrieve user data.",
      );
      expect(showErrorToast).toHaveBeenCalledWith(
        undefined,
        "Failed to fetch user data",
      );
    });
  });

  describe("authenticate", () => {
    it("should return the authentication data", async () => {
      const mockResponse = { data: { access_token: "token" } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.authenticate("state", "code");

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=code&state=state`,
      );
    });

    it("should show error toast and throw error on failure", async () => {
      apiClient.get.mockRejectedValue(new Error("Network Error"));

      await expect(authService.authenticate("state", "code")).rejects.toThrow(
        "Failed to authenticate user.",
      );
      expect(showErrorToast).toHaveBeenCalledWith(
        undefined,
        "Authentication failed",
      );
    });
  });
});
