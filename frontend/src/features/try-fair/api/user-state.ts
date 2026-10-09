import { API_ENDPOINTS, apiClient } from "@/services";
import type { BBOX } from "@/types";
import { useMutation } from "@tanstack/react-query";

export type UserState = {
  state: {
    type: string;
    prediction_id: number;
    name: string;
    model: {
      id: string;
      title: string;
    };
    imagery: {
      name: string;
      url: string;
    };
    zoom: number;
    bbox: BBOX;
  };
};

export type SavedUserState = UserState & {
  pid: number;
  timestamp: string;
};

const saveUserState = async (payload: UserState): Promise<SavedUserState> => {
  const res = await apiClient.post<SavedUserState>(
    API_ENDPOINTS.SAVE_USER_STATE,
    payload,
  );
  return res.data;
};

export const useSaveUserState = () => {
  return useMutation({
    mutationFn: saveUserState,
    mutationKey: ["user-state"],
  });
};
