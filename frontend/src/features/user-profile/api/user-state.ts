import { UserState } from "@/features/try-fair/api/user-state";
import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";


export type SavedUserState = UserState & {
  "count": number;
    "next": number | null;
    "previous": number | null;
    "results": UserState[];
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
