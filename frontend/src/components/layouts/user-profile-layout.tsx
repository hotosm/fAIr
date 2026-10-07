import { Outlet } from "react-router-dom";
import UserSidebar from "@/features/user-profile/components/user-sidebar";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

export const UserProfileLayout = () => {
  const { mappingMode } = useTryFairParams();

  if (mappingMode === "advanced") {
    return (
      <main className="my-6 min-w-0">
        <div className="flex min-w-0 flex-col items-start gap-4 lg:flex-row lg:gap-6">
          <div className="w-full min-w-0 lg:w-60 lg:shrink-0 xl:w-64">
            <UserSidebar />
          </div>
          <div className="w-full min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-w-0 mt-6 mb-10">
      <Outlet />
    </main>
  );
};
