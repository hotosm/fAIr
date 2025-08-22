import { useAuth } from "@/app/providers/auth-provider";
import {
  ProfileNavigationTabs,
  ProfileOverview,
} from "@/features/user-profile/components";
import { Outlet } from "react-router-dom";

export const UserProfileLayout = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen mt-6 mb-10">
      <div className="flex flex-col gap-y-10 mb-10">
        <ProfileOverview user={user} />
        <ProfileNavigationTabs />
      </div>
      <Outlet />
    </main>
  );
};
