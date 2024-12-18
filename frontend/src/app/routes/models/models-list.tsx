import {
  useModelsListFilters,
  useModelsMapData,
} from "@/features/models/hooks/use-models";
import { useEffect, useMemo } from "react";
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
import Pagination, { PAGE_LIMIT } from "@/components/shared/pagination";
import { APP_CONTENT } from "@/utils";
import { PageHeader } from "@/features/models/components/";
import { FeatureCollection } from "@/types";
import ModelNotFound from "@/features/models/components/model-not-found";
import { useDialog } from "@/hooks/use-dialog";
import { MobileModelFiltersDialog } from "@/features/models/components/dialogs";
import { Head } from "@/components/seo";
import { LayoutView } from "@/enums/models";
import { useScrollToElement, useScrollToTop } from "@/hooks/use-scroll-to-element";

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
  const mapViewElementId = "map-view";
  const { scrollToElement } = useScrollToElement(mapViewElementId);
  const { scrollToTop } = useScrollToTop()
  const {
    clearAllFilters,
    data,
    isError,
    isPending,
    isPlaceholderData,
    query,
    updateQuery,
    mapViewIsActive,
  } = useModelsListFilters(0);

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

  // Mapview toggling interaction
  useEffect(() => {
    if (mapViewIsActive) {
      scrollToElement();
    } else {
      scrollToTop()
    }
  }, [mapViewIsActive]);

  const renderContent = () => {
    if (data?.count === 0) {
      return <ModelNotFound />;
    }

    if (mapViewIsActive) {
      return (
        <div
          id={mapViewElementId}
          className="w-full grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 md:border rounded-md lg:p-2 md:border-gray-border gap-x-2 mt-10  gap-y-6 lg:gap-y-0 h-screen"
        >
          <div className="w-full overflow-y-auto lg:row-start-1">
            <ModelListGridLayout
              models={data?.results}
              isPending={isPending}
              isError={isError}
            />
          </div>
          <div className="row-start-1">
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
      <Head title="Explore Models" />
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
                    centerOnMobile={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {renderContent()}
        {/* mobile pagination */}
        <div className="w-full flex items-center justify-center md:hidden mt-10">
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
