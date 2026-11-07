import { MapRequestsSection } from "@/features/user-profile/components/overview/map-requests-section";
import { OverviewHero } from "@/features/user-profile/components/overview/overview-hero";
import { RecentActivities } from "@/features/user-profile/components/overview/recent-activities";

export const AdvancedOverview = () => {
  return (
    <div className="flex flex-1 flex-col gap-y-6">
      <h1 className="text-title-2 font-medium text-dark">Overview</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <OverviewHero />
        </div>
        <RecentActivities className="lg:col-span-2" />
      </div>

      <MapRequestsSection title="Recent Map Requests" />
    </div>
  );
};
