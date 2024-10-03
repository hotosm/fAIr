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

export type TModel = {
  id: number,
  name: string,
  created_at: string,
  last_modified: string,
  published_training: number,
  status: number,
  dataset: number,
  created_by: {
    date_joined: string
    img_url: string
    osm_id: number
    username: string
  }
}

export type PaginatedModels = {
  count: number
  next: string | null
  previous: string | null
  results: TModel[]
  hasNext: boolean
  hasPrev: boolean
}

