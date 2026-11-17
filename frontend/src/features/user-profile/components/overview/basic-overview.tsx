import { LegendBookIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { MapRequestsSection } from "./map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";
import { GlobeIcon } from "@/components/ui/icons/globe-icon";
import { ElipsisIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";
import { HistoryIcon } from "@/components/ui/icons/refresh-icon";
import { FULSCREEN_ON_PHONES } from "@/features/user-profile/components/overview/overview-layout";

export const COMMUNITY_URL = "https://slack.hotosm.org/";

const menuItemClassName =
  "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-dark hover:bg-light-gray";

/** Phones: Mapping History, Learn and Community behind a ⋮ button. */
const HeaderActionsMenu = () => (
  <DropDown
    placement={DropdownPlacement.BOTTOM_END}
    disableCheveronIcon
    triggerComponent={
      <span
        aria-label="More dashboard links"
        className="flex size-8 items-center justify-center rounded-full bg-light-gray text-dark"
      >
        <ElipsisIcon className="size-4 rotate-90" />
      </span>
    }
  >
    <div className="flex min-w-[200px] flex-col gap-1 rounded-lg bg-white p-1">
      <Link
        href={APPLICATION_ROUTES.PROFILE_MAPPING_HISTORY}
        title="Mapping History"
        nativeAnchor={false}
        disableLinkStyle
        className={menuItemClassName}
      >
        <HistoryIcon className="size-4" />
        Mapping History
      </Link>
      <Link
        href={APPLICATION_ROUTES.LEARN_BASE}
        title="Learn"
        nativeAnchor={false}
        disableLinkStyle
        className={menuItemClassName}
      >
        <LegendBookIcon className="size-4" />
        Learn
      </Link>
      <Link
        href={COMMUNITY_URL}
        title="Join our Community"
        nativeAnchor
        disableLinkStyle
        className={menuItemClassName}
      >
        <GlobeIcon className="size-4" />
        Join Community
      </Link>
    </div>
  </DropDown>
);

const HeaderAction = ({
  href,
  external,
  icon,
  label,
}: {
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    href={href}
    title={label}
    nativeAnchor={external}
    className="flex items-center gap-x-2 rounded-md border border-gray-border bg-off-white px-3 py-2 text-xs text-dark"
  >
    {icon}

    {label}
  </Link>
);

export const BasicOverview = () => {
  return (
    <div className="flex flex-col gap-y-6">
      <ProfilePageTitle
        title="Dashboard"
        actions={
          <>
            <div className="hidden flex-wrap items-center gap-3 sm:flex">
              <HeaderAction
                href={APPLICATION_ROUTES.LEARN_BASE}
                icon={<LegendBookIcon className="size-4" />}
                label="Learn"
              />
              <HeaderAction
                href={COMMUNITY_URL}
                external
                icon={<GlobeIcon className="size-4" />}
                label="Join our Community"
              />
            </div>
          </>
        }
        phoneMenu={<HeaderActionsMenu />}
      />

      {/* <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <OverviewHero />
        <RecentActivities />
      </div> */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {/* Phones: the hero runs edge to edge, past the page gutter. */}
        <div className="-mx-4 min-w-0 sm:mx-0 lg:col-span-4">
          <OverviewHero />
        </div>
        {/* Phones reach Mapping History from the ⋮ menu instead. */}
        <RecentActivities className="hidden sm:flex lg:col-span-2" />
      </div>
      <MapRequestsSection
        title="Map Requests"
        className={FULSCREEN_ON_PHONES}
      />
    </div>
  );
};
