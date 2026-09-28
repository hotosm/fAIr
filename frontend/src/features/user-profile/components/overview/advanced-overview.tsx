import { MapRequestsSection } from "@/features/user-profile/components/overview/map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";

export const AdvancedOverview = () => {
  return (
    <div className="flex flex-1 flex-col gap-y-6">
      <h1 className="text-title-2 font-medium text-dark">Overview</h1>

      <div className="flex sm:flex-row flex-col min-h-[410px] w-full gap-4 ">
        <OverviewHero />
        <RecentActivities />
      </div>

      <MapRequestsSection title="Recent Map Requests" />
    </div>
  );
};
