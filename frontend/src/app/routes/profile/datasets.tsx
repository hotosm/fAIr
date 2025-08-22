import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
import { OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { DatasetList } from "@/features/datasets/components";
import { useDatasetsQueryParams } from "@/features/datasets/hooks/use-query-params";
import { ProfileSectionHeader } from "@/features/user-profile/components";
import { TTrainingDataset } from "@/types";

export const UserProfileDatasetsPage = () => {
  const { user } = useAuth();
  const {
    data,
    isError,
    isPending,
    isPlaceholderData,
    refetch,
    query,
    updateQuery,
  } = useDatasetsQueryParams(user.osm_id);

  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.datasets.pageTitle} />
      <div className="space-y-8">
        {/* Section heading */}
        <div className="flex w-full flex-col items-start justify-between gap-y-6 sm:flex-row sm:items-center sm:gap-y-0">
          <ProfileSectionHeader
            title={USER_PROFILE_PAGE_CONTENT.datasets.sectionTitle}
          />
          <SearchFilter
            query={query}
            updateQuery={updateQuery}
            placeholder="Search datasets..."
            className="w-full max-w-full sm:w-auto"
          />
        </div>
        <div className="flex w-full flex-col justify-between gap-y-6 md:gap-y-0">
          <p className="text-body-3 font-semibold">{data?.count} datasets</p>
          <div className="flex w-full items-center justify-between md:justify-end md:gap-x-4">
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
        {/* Dataset List */}
        <DatasetList
          isError={isError}
          datasets={data?.results as TTrainingDataset[]}
          isPending={isPending}
          refetch={refetch}
          navigateOnClick
        />
      </div>
    </>
  );
};
