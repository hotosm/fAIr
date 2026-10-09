import type { SavedUserState as UserStateRecord } from "@/features/try-fair/api/user-state";
import { API_ENDPOINTS, apiClient } from "@/services";
import { skipToken, useQuery } from "@tanstack/react-query";


export type SavedUserState = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserStateRecord[];
};

const getUserState = async (): Promise<SavedUserState> => {
  const res = await apiClient.get<SavedUserState>(
    API_ENDPOINTS.SAVE_USER_STATE,
  
  );
  return res.data;
};

export const useGetUserStates = () => {
  return useQuery({
    queryFn: getUserState,
    queryKey: ["user-state"],
  });
};

/** Fetch a saved mapping project by its user-state pid, not its prediction ID. */
export const useGetUserState = (pid?: string) => {
  return useQuery({
    queryKey: ["user-state", pid],
    queryFn: pid
      ? async ({ signal }) => {
          const { data } = await apiClient.get<UserStateRecord>(
            API_ENDPOINTS.GET_SINGLE_USER_STATE(pid),
            { signal },
          );
          return data;
        }
      : skipToken,
    refetchOnWindowFocus: false,
  });
};
