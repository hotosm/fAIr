import {
  ChevronDownIcon,
  DatabaseIcon,
  SettingsIcon,
  TimerIcon,
} from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants";
import { HOTTeamTwo } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { useLocation } from "react-router-dom";
import { cn } from "@/utils";
import { OverviewIcon } from "@/components/ui/icons/overview-icon";
import { AIModelIcon } from "@/components/ui/icons/ai-model-icon";

/**
 * Dashboard navigation. `stacked` is the mobile menu layout: one column of
 * larger items with Settings in the list, and the Join the Community card.
 */
const UserSidebar = ({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean;
  /** Called when a link is chosen, e.g. to close the mobile menu. */
  onNavigate?: () => void;
}) => {
  const { pathname } = useLocation();
  // On mobile, Settings is an item in the list like the others.
  const links = stacked ? [...SIDEBAR_LINKS, SETTINGS_LINK] : SIDEBAR_LINKS;

  return (
    <aside
      className={cn(
        "flex w-full min-w-0 flex-col",
        stacked
          ? "gap-6"
          : "gap-4 rounded-xl bg-frosted-blue p-2 shadow-sm lg:min-h-[calc(100dvh-8.75rem)] lg:gap-6 lg:py-4",
      )}
    >
      <div
        className={cn(
          "grid gap-2",
          stacked ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-1",
        )}
      >
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              className="w-full"
              title={link.title}
              key={link.id}
              href={link.href}
              nativeAnchor={false}
              disableLinkStyle
              onClick={onNavigate}
            >
              <div
                className={cn(
                  "flex rounded-xl items-center transition-colors duration-300",
                  stacked
                    ? "gap-4 px-5 py-3.5 text-base"
                    : "gap-2 py-3 px-2 lg:px-3 text-sm",
                  isActive
                    ? "bg-primary text-white shadow-sm font-medium"
                    : "text-lighter-ink hover:bg-[#FFEDED]/50 hover:text-primary",
                )}
              >
                <link.Icon
                  className={cn(
                    "size-5 shrink-0",
                    isActive ? "text-white" : "text-lighter-ink",
                  )}
                />
                {link.title}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="lg:mt-auto lg:flex lg:flex-col lg:gap-3">
        <Link
          href="https://slack.hotosm.org/"
          title="Join the Community"
          blank
          disableLinkStyle
          className={cn(
            "rounded-xl bg-white p-3 flex-col justify-between",
            stacked ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="wave-bg flex items-center justify-between px-3 py-8">
            <h4 className="text-lg font-semibold text-gray">
              Join the <br />
              Community
            </h4>
            <div className="rounded-full bg-white p-4">
              <ChevronDownIcon className="size-4 -rotate-90 text-primary" />
            </div>
          </div>
          <div className="h-[150px] w-full overflow-hidden rounded-xl">
            <Image
              src={HOTTeamTwo}
              alt="Join community"
              className="h-full w-full object-cover"
            />
          </div>
        </Link>

        {/* Wider screens: Settings sits below the community card. */}
        {!stacked && (
          <div className="px-2 py-2 lg:p-3">
            <Link
              nativeAnchor={false}
              href={APPLICATION_ROUTES.PROFILE_SETTINGS}
              title="Settings"
              disableLinkStyle
              className={cn(
                "flex items-center gap-4 transition-all duration-300",
                pathname === APPLICATION_ROUTES.PROFILE_SETTINGS
                  ? "font-medium text-primary"
                  : "text-lighter-ink hover:text-primary",
              )}
            >
              <SettingsIcon
                className={cn(
                  "size-5 transition-all duration-300",
                  pathname === APPLICATION_ROUTES.PROFILE_SETTINGS
                    ? "text-primary"
                    : "text-lighter-ink",
                )}
              />
              Settings
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default UserSidebar;

const SETTINGS_LINK = {
  id: 6,
  title: "Settings",
  href: APPLICATION_ROUTES.PROFILE_SETTINGS,
  Icon: SettingsIcon,
};

const SIDEBAR_LINKS = [
  {
    id: 1,
    title: "Overview",
    href: APPLICATION_ROUTES.PROFILE_BASE,
    Icon: OverviewIcon,
  },
  {
    id: 2,
    title: "AI Models",
    href: APPLICATION_ROUTES.PROFILE_MODELS,
    Icon: AIModelIcon,
  },
  {
    id: 3,
    title: "Datasets",
    href: APPLICATION_ROUTES.PROFILE_DATASETS,
    Icon: DatabaseIcon,
  },

  {
    id: 5,
    title: "Map Requests",
    href: APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS,
    Icon: TimerIcon,
  },
];
