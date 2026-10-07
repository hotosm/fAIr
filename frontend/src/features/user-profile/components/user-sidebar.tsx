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

const UserSidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="w-full min-w-0 rounded-xl bg-frosted-blue p-2 shadow-sm flex flex-col gap-4 lg:py-4 lg:gap-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              className="w-full"
              title={link.title}
              key={link.id}
              href={link.href}
              nativeAnchor={false}
              disableLinkStyle
            >
              <div
                className={cn(
                  "flex gap-2 py-3 px-2 lg:px-3 rounded-xl items-center text-sm transition-colors duration-300 ",
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

      <Link
        href="https://slack.hotosm.org/"
        title="Join the Community"
        blank
        disableLinkStyle
        className="hidden p-3 bg-white justify-between rounded-xl lg:flex lg:flex-col"
      >
        <div className="flex justify-between wave-bg items-center py-8 px-3">
          <h4 className="font-semibold text-lg text-gray">
            Join the <br />
            Community
          </h4>
          <div className="p-4 rounded-full bg-white">
            <ChevronDownIcon className="size-4 -rotate-90 text-primary" />
          </div>
        </div>
        <div className={`w-full h-[150px] rounded-xl overflow-hidden `}>
          <Image
            src={HOTTeamTwo}
            alt={"Join community"}
            className={`h-full w-full object-cover`}
          />
        </div>
      </Link>

      <div className="px-2 py-2 lg:p-3">
        <Link
          nativeAnchor={false}
          href={APPLICATION_ROUTES.PROFILE_SETTINGS}
          title={"Settings"}
          disableLinkStyle
          className={cn(
            "flex items-center gap-4 transition-all duration-300 ",
            pathname === APPLICATION_ROUTES.PROFILE_SETTINGS
              ? "text-primary font-medium"
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
    </aside>
  );
};

export default UserSidebar;

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
