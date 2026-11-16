import { MapRequestsSection } from "@/features/user-profile/components/overview/map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";
import { cn } from "@/utils";
import { FULSCREEN_ON_PHONES } from "./overview-layout";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";

export const AdvancedOverview = () => {
  return (
    <div className="flex flex-1 flex-col gap-y-6">
      <ProfilePageTitle title="Overview" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Phones: the hero and sections run edge to edge. */}
        <div className="-mx-4 min-w-0 sm:mx-0 lg:col-span-3">
          <OverviewHero />
        </div>
        <RecentActivities className={cn("lg:col-span-2")} />
      </div>

      <MapRequestsSection
        title="Recent Map Requests"
        className={FULSCREEN_ON_PHONES}
      />
    </div>
  );
};
