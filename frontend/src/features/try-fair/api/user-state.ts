import { API_ENDPOINTS, apiClient } from "@/services";
import type { BBOX } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import type { PredictResult } from "@/features/try-fair/hooks/use-fair-predict";

export type MappingUserState = {
  state: {
    type: "mapping";
    category: string;
    name: string;
    model: { id: string; title: string };
    imagery: { name: string; url: string };
    zoom: number | null;
    bbox: BBOX | null;
    url_params: ReturnType<typeof useTryFairParams>["urlState"];
    params: Record<string, number | string | boolean>;
    prediction_result?: PredictResult | null;
  };
};

export type UserState = {
  state: {
    type: string;
    prediction_id?: number;
    category?: string;
    name: string;
    model: {
      id: string;
      title: string;
    };
    imagery: {
      name: string;
      url: string;
    };
    zoom: number | null;
    bbox: BBOX | null;
    url_params?: MappingUserState["state"]["url_params"];
    params?: MappingUserState["state"]["params"];
    prediction_result?: PredictResult | null;
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveUserState,
    mutationKey: ["user-state"],
    onSuccess: (saved) => {
      queryClient.setQueryData(["user-state", String(saved.pid)], saved);
      queryClient.invalidateQueries({ queryKey: ["user-state"], exact: true });
    },
  });
};

export const useUpdateUserState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pid, payload }: {
      pid: number;
      payload: MappingUserState;
    }) => {
      const { data } = await apiClient.patch<SavedUserState>(
        API_ENDPOINTS.EDIT_USER_STATE(pid),
        payload,
      );
      return data;
    },
    mutationKey: ["update-user-state"],
    onSuccess: (saved) => {
      queryClient.setQueryData(["user-state", String(saved.pid)], saved);
      queryClient.invalidateQueries({ queryKey: ["user-state"], exact: true });
    },
  });
};
