import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
import { OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { ProfileSectionHeader } from "@/features/user-profile/components";
import OfflinePredictionsTable from "@/features/user-profile/components/offline-predictions-table";
import { useOfflinePredictionsQueryParams } from "@/features/user-profile/hooks/use-predictions";

export const UserProfileOfflinePredictionsPage = () => {
  const { user } = useAuth();
  const { data, isError, isPending, isPlaceholderData, query, updateQuery } =
    useOfflinePredictionsQueryParams(user.osm_id);

  return (
    <>
      <Head title="Offline Predictions" />
      <div className="space-y-8 h-full">
        {/* Section heading */}
        <div className="w-full gap-y-6 sm:gap-y-0 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <ProfileSectionHeader title={"Predictions"} />
          <SearchFilter
            query={query}
            updateQuery={updateQuery}
            placeholder="Search ..."
            className="w-full max-w-full sm:w-auto"
          />
        </div>
        <div className="flex flex-col gap-y-6 md:gap-y-0 w-full justify-between">
          <p className="text-body-3 font-semibold">
            {data?.count} prediction{data?.count && data?.count > 1 ? "s" : ""}
          </p>
          <div className="flex w-full justify-between md:justify-end items-center md:gap-x-4">
            <OrderingFilter
              query={query}
              updateQuery={updateQuery}
              disabled={isError || isPending}
              className="inline-flex"
            />
            <div>
              <Pagination
                totalLength={data?.count as number}
                hasNextPage={data?.hasNext as boolean}
                hasPrevPage={data?.hasPrev as boolean}
                disableNextPage={!data?.hasNext || isPlaceholderData}
                disablePrevPage={!data?.hasPrev}
                query={query}
                updateQuery={updateQuery}
                isPlaceholderData={isPlaceholderData}
                scrollToTopOnPageSwitch
              />
            </div>
          </div>
        </div>
        <OfflinePredictionsTable
          data={data?.results ?? []}
          isError={isError}
          isPending={isPending}
        />
      </div>
    </>
  );
};
