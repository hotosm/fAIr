import {
  useModelsListFilters,
  useModelsMapData,
} from "@/features/models/hooks/use-models";
import { useMemo } from "react";
import {
  ModelListGridLayout,
  ModelListTableLayout,
} from "@/features/models/layouts";
import {
  LayoutToggle,
  ModelMapToggle,
  ModelsMap,
} from "@/features/models/components";
import {
  CategoryFilter,
  ClearFilters,
  DateRangeFilter,
  MobileFilter,
  OrderingFilter,
  SearchFilter,
} from "@/features/models/components/filters";
import Pagination, { PAGE_LIMIT } from "@/components/pagination";
import { APP_CONTENT } from "@/utils";
import { PageHeader } from "@/features/models/components/";
import { FeatureCollection } from "@/types";
import ModelNotFound from "@/features/models/components/model-not-found";
import { useDialog } from "@/hooks/use-dialog";
import { MobileModelFiltersDialog } from "@/features/models/components/dialogs";
import { Head } from "@/components/seo";
import { LayoutView } from "@/enums/models";

export const SEARCH_PARAMS = {
  startDate: "start_date",
  endDate: "end_date",
  mapIsActive: "map",
  ordering: "orderBy",
  searchQuery: "q",
  offset: "offset",
  dateFilter: "dateFilter",
  layout: "layout",
  id: "id",
  status: "status",
};

export const ModelsPage = () => {
  const { isOpened, openDialog, closeDialog } = useDialog();

  const {
    clearAllFilters,
    data,
    isError,
    isPending,
    isPlaceholderData,
    query,
    updateQuery,
    mapViewIsActive,
  } = useModelsListFilters();

  const {
    data: mapData,
    isPending: modelsMapDataIsPending,
    isError: modelsMapDataIsError,
  } = useModelsMapData();

  // Since it's just a static filter, it's better to memoize it.
  const memoizedCategoryFilter = useMemo(
    () => <CategoryFilter disabled={isPending} />,
    [isPending],
  );

  const renderContent = () => {
    if (data?.count === 0) {
      return (
        <div className="h-[400px] flex w-full col-span-5 items-center justify-center">
          <ModelNotFound />
        </div>
      );
    }

    if (mapViewIsActive) {
      return (
        <div className="w-full grid md:grid-cols-4 md:border rounded-md md:p-2 md:border-gray-border gap-x-2 mt-10 grid-rows-2 md:grid-rows-1 gap-y-6 md:gap-y-0 h-screen">
          <div className="w-full overflow-y-scroll md:row-start-1 col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-10">
              <ModelListGridLayout
                models={data?.results}
                isPending={isPending}
                isError={isError}
              />
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 row-start-1 ">
            {modelsMapDataIsPending || modelsMapDataIsError ? (
              <div className="w-full h-full animate-pulse bg-light-gray"></div>
            ) : (
              <ModelsMap
                mapResults={mapData as FeatureCollection}
                updateQuery={updateQuery}
              />
            )}
          </div>
        </div>
      );
    }

    if (query[SEARCH_PARAMS.layout] === LayoutView.LIST) {
      return (
        <div className="col-span-5">
          <ModelListTableLayout
            isPending={isPending}
            models={data?.results}
            isError={isError}
          />
        </div>
      );
    }
    return (
      <ModelListGridLayout
        isPending={isPending}
        models={data?.results}
        isError={isError}
      />
    );
  };

  return (
    <>
      <Head title="Explore fAIr Models" />
      <MobileModelFiltersDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        query={query}
        updateQuery={updateQuery}
        disabled={isPending}
      />
      <section className="my-10 min-h-screen">
        <PageHeader />
        {/* Filters */}
        <div className="sticky top-0 bg-white z-10 py-2">
          <div className="flex flex-col gap-y-4">
            <div className=" flex items-center justify-between w-full ">
              <div className="flex items-center justify-between w-full md:gap-x-4 gap-y-2 md:gap-y-0  md:w-auto">
                <SearchFilter updateQuery={updateQuery} query={query} />
                {memoizedCategoryFilter}
                {/* Mobile filters */}
                <div className="flex md:hidden items-center gap-x-4">
                  <MobileFilter openMobileFilterModal={openDialog} />
                  <LayoutToggle
                    updateQuery={updateQuery}
                    query={query}
                    isMobile
                    disabled={Boolean(mapViewIsActive)}
                  />
                </div>
                <DateRangeFilter
                  disabled={isPending}
                  updateQuery={updateQuery}
                  query={query}
                />
                {/* Desktop */}
                <ClearFilters query={query} clearAllFilters={clearAllFilters} />
              </div>
              <div className="md:flex items-center gap-x-10 hidden">
                {/* Desktop */}
                <ModelMapToggle updateQuery={updateQuery} query={query} />
                <LayoutToggle
                  updateQuery={updateQuery}
                  query={query}
                  disabled={Boolean(mapViewIsActive)}
                />
              </div>
            </div>
            {/* Mobile */}
            <div className="self-start">
              <ClearFilters
                query={query}
                clearAllFilters={clearAllFilters}
                isMobile
              />
            </div>
          </div>
          {isPending ? (
            <div className="w-full h-10 mt-10 bg-light-gray animate-pulse text-dark"></div>
          ) : (
            <div className="flex items-center justify-between w-full my-10 top-16">
              <div className="w-full flex items-center justify-between">
                <p className="font-semibold text-body-3">
                  {data?.count}{" "}
                  {
                    APP_CONTENT.models.modelsList.sortingAndPaginationSection
                      .modelCountSuffix
                  }
                </p>
                <ModelMapToggle
                  query={query}
                  updateQuery={updateQuery}
                  isMobile
                />
              </div>
              <div className="flex items-center gap-x-9">
                <OrderingFilter
                  disabled={isPending}
                  query={query}
                  updateQuery={updateQuery}
                />
                <div className="hidden md:flex">
                  <Pagination
                    totalLength={data?.count}
                    hasNextPage={data?.hasNext}
                    hasPrevPage={data?.hasPrev}
                    disableNextPage={!data?.hasNext || isPlaceholderData}
                    disablePrevPage={!data?.hasPrev}
                    pageLimit={PAGE_LIMIT}
                    query={query}
                    updateQuery={updateQuery}
                    isPlaceholderData={isPlaceholderData}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`my-10 ${mapViewIsActive ? "" : "grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-7 gap-y-14"}`}
        >
          {renderContent()}
        </div>
        {/* mobile pagination */}
        <div className="w-full flex items-center justify-center md:hidden">
          <Pagination
            totalLength={data?.count}
            hasNextPage={data?.hasNext}
            hasPrevPage={data?.hasPrev}
            disableNextPage={!data?.hasNext || isPlaceholderData}
            disablePrevPage={!data?.hasPrev}
            pageLimit={PAGE_LIMIT}
            query={query}
            updateQuery={updateQuery}
            isPlaceholderData={isPlaceholderData}
          />
        </div>
      </section>
    </>
  );
};
