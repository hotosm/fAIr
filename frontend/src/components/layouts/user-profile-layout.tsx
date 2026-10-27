import { Outlet } from "react-router-dom";
import UserSidebar from "@/features/user-profile/components/user-sidebar";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

export const UserProfileLayout = () => {
  const { mappingMode } = useTryFairParams();

  if (mappingMode === "advanced") {
    return (
      <main className="my-6 flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-4 lg:flex-row lg:gap-6">
          <div className="w-full min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:w-60 lg:shrink-0 lg:self-start lg:overflow-y-auto xl:w-60">
            <UserSidebar />
          </div>
          <div className="flex w-full min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-6 mb-10 flex min-w-0 flex-1 flex-col">
      <Outlet />
    </main>
  );
};
