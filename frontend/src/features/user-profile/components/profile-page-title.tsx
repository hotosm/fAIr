import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import MappingMode from "@/features/try-fair/components/mapping-mode";
import { useProfileSidebar } from "@/features/user-profile/components/profile-sidebar-context";
import { cn } from "@/utils";

/**
 * Dashboard page title row. Below desktop width it adds a ☰ that opens the
 * dashboard sidebar (advanced mode), and on phones the mode switch, which
 * the navbar shows on wider screens.
 */
export const ProfilePageTitle = ({
  title,
  actions,
  phoneMenu,
  showModeSwitch = true,
  showSidebarButton = true,
  className,
}: {
  title: string;
  /** Extra controls on the right, before the phone mode switch. */
  actions?: React.ReactNode;
  /** Phones only: shown after the mode switch, e.g. a ⋮ menu. */
  phoneMenu?: React.ReactNode;
  /** Phones: show the Basic/Advanced switch (some pages' designs don't). */
  showModeSwitch?: boolean;
  /** Show the ☰ for the dashboard menu; off where a Back button is used. */
  showSidebarButton?: boolean;
  className?: string;
}) => {
  const sidebar = useProfileSidebar();

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {sidebar && showSidebarButton && (
          <button
            type="button"
            onClick={sidebar.openSidebar}
            aria-label="Open dashboard menu"
            className="shrink-0 lg:hidden"
          >
            <Image src={HamburgerIcon} alt="" width="20px" height="20px" />
          </button>
        )}
        {/* Phones: a modest heading, as in the mobile designs. */}
        <h1 className="truncate text-lg font-medium text-dark sm:text-title-2">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <div className="flex items-center gap-2 sm:hidden">
          {showModeSwitch && <MappingMode tourTarget={false} />}
          {phoneMenu}
        </div>
      </div>
    </div>
  );
};
