import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { NavLogo } from "@/components/layouts/navbar/nav-logo";
import { CloseIcon } from "@/components/ui/icons";
import UserSidebar from "@/features/user-profile/components/user-sidebar";
import { ProfileSidebarContext } from "@/features/user-profile/components/profile-sidebar-context";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

export const UserProfileLayout = () => {
  const { mappingMode } = useTryFairParams();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Picking a page in the drawer navigates; close it so the page shows.
  useEffect(() => setIsSidebarOpen(false), [pathname]);

  const sidebar = useMemo(
    () => ({ openSidebar: () => setIsSidebarOpen(true) }),
    [],
  );

  if (mappingMode === "advanced") {
    return (
      <ProfileSidebarContext.Provider value={sidebar}>
        <main className="my-6 flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-4 lg:flex-row lg:gap-6">
            {/* Desktop: sidebar beside the page. Smaller screens: a drawer
                opened from the ☰ in the page title. */}
            <div className="hidden w-full min-w-0 lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:w-60 lg:shrink-0 lg:self-start lg:overflow-y-auto xl:w-60">
              <UserSidebar />
            </div>
            {/* Full-screen menu, as in the mobile dashboard design. */}
            <Drawer
              open={isSidebarOpen}
              setOpen={setIsSidebarOpen}
              placement={DrawerPlacements.START}
              label="Dashboard menu"
              className="lg:hidden [&::part(body)]:px-5 [&::part(body)]:py-4 [&::part(panel)]:w-full [&::part(panel)]:bg-frosted-blue"
            >
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <NavLogo />
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="Close dashboard menu"
                    className="p-1 text-dark"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </div>
                <UserSidebar
                  stacked
                  onNavigate={() => setIsSidebarOpen(false)}
                />
              </div>
            </Drawer>
            <div className="flex w-full min-w-0 flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </main>
      </ProfileSidebarContext.Provider>
    );
  }

  return (
    <main className="mt-6 mb-10 flex min-w-0 flex-1 flex-col">
      <Outlet />
    </main>
  );
};
