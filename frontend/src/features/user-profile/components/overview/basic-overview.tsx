import { LegendBookIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { MapRequestsSection } from "./map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";
import { GlobeIcon } from "@/components/ui/icons/globe-icon";

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
      <div className="flex flex-col gap-y-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-title-2 font-medium text-dark">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <HeaderAction
            href={APPLICATION_ROUTES.LEARN_BASE}
            icon={<LegendBookIcon className="size-4" />}
            label="Learn"
          />
          <HeaderAction
            href="https://slack.hotosm.org/"
            external
            icon={<GlobeIcon className="size-4" />}
            label="Join our Community"
          />
        </div>
      </div>

      {/* <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <OverviewHero />
        <RecentActivities />
      </div> */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="min-w-0 lg:col-span-4">
          <OverviewHero />
        </div>
        <RecentActivities className="lg:col-span-2" />
      </div>
      <MapRequestsSection title="Map Requests" />
    </div>
  );
};
