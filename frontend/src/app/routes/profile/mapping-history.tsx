import { useNavigate } from "react-router-dom";
import { Head } from "@/components/seo";
import { ArrowBackIcon } from "@/components/ui/icons";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { useGetUserStates } from "@/features/user-profile/api/user-state";
import { MappingHistoryList } from "@/features/user-profile/components/overview/mapping-history-list";
import { OverviewEmptyState } from "@/features/user-profile/components/overview/overview-empty-state";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";

/** All of the user's saved mapping projects, newest first. */
export const UserProfileMappingHistoryPage = () => {
  const navigate = useNavigate();
  const { data, isPending, isError } = useGetUserStates();
  const activities = data?.results ?? [];

  return (
    <>
      <Head title="Mapping History" />
      <div className="flex max-w-2xl flex-col gap-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 text-xs text-dark hover:text-primary sm:text-sm"
        >
          <ArrowBackIcon className="size-4" />
          Back
        </button>
        {/* As in the mobile design: Back is the way out, so no ☰ or mode
            switch next to the title. */}
        <ProfilePageTitle
          title="Mapping History"
          showModeSwitch={false}
          showSidebarButton={false}
        />

        {isPending ? (
          <TableSkeleton rows={5} columns={3} />
        ) : isError ? (
          <p role="alert" className="py-4 text-sm text-grey">
            Couldn't load your mapping history.
          </p>
        ) : activities.length ? (
          <MappingHistoryList activities={activities} />
        ) : (
          <OverviewEmptyState message="No mapping history yet" />
        )}
      </div>
    </>
  );
};
