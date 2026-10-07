import { MapRequestsSection } from "@/features/user-profile/components/overview/map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";

export const AdvancedOverview = () => {
  return (
    <div className="flex flex-1 flex-col gap-y-6">
      <h1 className="text-title-2 font-medium text-dark">Overview</h1>

      <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] gap-4">
        <OverviewHero />
        <RecentActivities />
      </div>

      <MapRequestsSection title="Recent Map Requests" />
    </div>
  );
};
