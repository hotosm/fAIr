/**
 * This file contains the different types/schema for the API responses from the backend.
 */

export type TLogin = {
  login_url: string;
};

export type TAuthenticate = {
  access_token: string;
};

export type TUser = {
  date_joined: string;
  email: string;
  img_url: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  osm_id: number;
  user_permission: [];
  username: string;
};
