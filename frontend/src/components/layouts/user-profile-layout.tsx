import { Outlet } from "react-router-dom";
import UserSidebar from "@/features/user-profile/components/user-sidebar";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

export const UserProfileLayout = () => {
  const { mappingMode } = useTryFairParams();


  if (mappingMode === "advanced") {
    return (
      <main className="mt-6 mb-6">
        {/* Fixed-height row: the sidebar stays pinned while only the content
            column scrolls, so the sidebar never moves with the page. */}
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          {/* Sidebar — hidden on small screens where it can't fit. */}
          <div className="hidden lg:block h-full shrink-0">
            <UserSidebar />
          </div>
          <div className="flex-1 min-w-0 h-full overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen mt-6 mb-10">
      <Outlet />
    </main>
  );
};
