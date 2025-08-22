import { useAuth } from "@/app/providers/auth-provider";
import {
  ProfileNavigationTabs,
  ProfileOverview,
} from "@/features/user-profile/components";
import { Outlet } from "react-router-dom";

export const UserProfileLayout = () => {
  const { user } = useAuth();

  return (
    <main className="mb-10 mt-6 min-h-screen">
      <div className="mb-10 flex flex-col gap-y-10">
        <ProfileOverview user={user} />
        <ProfileNavigationTabs />
      </div>
      <Outlet />
    </main>
  );
};
