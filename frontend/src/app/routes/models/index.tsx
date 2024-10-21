import {
  useModels,
  useModelsMapData,
} from "@/features/models/hooks/use-models";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategoryIcon, FilterIcon, ListIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/form";
import {
  ModelListGridLayout,
  ModelListTableLayout,
} from "@/features/models/layouts";
import { ModelsMap } from "@/features/models/components";
import {
  CategoryFilter,
  DateRangeFilter,
  OrderingFilter,
  SearchFilter,
} from "@/features/models/components/filters";
import Pagination, {
  PAGE_LIMIT,
} from "@/features/models/components/pagination";
import { APP_CONTENT, buildDateFilterQueryString } from "@/utils";
import { PageHeader } from "@/features/models/components/";
import { dateFilters } from "@/features/models/components/filters/date-range-filter";
import { ORDERING_FIELDS } from "@/features/models/components/filters/ordering-filter";
import { FeatureCollection, TQueryParams } from "@/types";
import ModelNotFound from "@/features/models/components/model-not-found";
import useDebounce from "@/hooks/use-debounce";
import { useDialog } from "@/hooks/use-dialog";
import { MobileModelFiltersDialog } from "@/features/models/components/dialogs";
import { Head } from "@/components/seo";

export enum LayoutView {
  LIST = "list",
  GRID = "grid",
}

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
};

const ClearFilters = ({
  query,
  clearAllFilters,
  isMobile,
}: {
  clearAllFilters: (event: React.ChangeEvent<HTMLButtonElement>) => void;
  query: TQueryParams;
  isMobile?: boolean;
}) => {
  const canClearAllFilters = Boolean(
    query[SEARCH_PARAMS.searchQuery] ||
      query[SEARCH_PARAMS.startDate] ||
      query[SEARCH_PARAMS.endDate] ||
      query[SEARCH_PARAMS.id],
  );

  return (
    <div className={`${isMobile ? "block md:hidden" : "hidden md:block"}`}>
      {canClearAllFilters ? (
        // @ts-expect-error bad type definition
        <Button variant="tertiary" size="medium" onClick={clearAllFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
};

const SetMapToggle = ({
  query,
  updateQuery,
  isMobile,
}: {
  updateQuery: (params: TQueryParams) => void;
  query: TQueryParams;
  isMobile?: boolean;
}) => {
  return (
    <div
      className={`${isMobile ? "inline-flex md:hidden" : "hidden md:inline-flex"} items-center gap-x-4`}
      role="button"
    >
      <p className="text-body-2base text-nowrap">
        {APP_CONTENT.models.modelsList.filtersSection.mapViewToggleText}
      </p>
      <Switch
        checked={query[SEARCH_PARAMS.mapIsActive] as boolean}
        disabled={query[SEARCH_PARAMS.layout] == LayoutView.LIST}
        handleSwitchChange={() => {
          updateQuery({
            [SEARCH_PARAMS.mapIsActive]: !query[SEARCH_PARAMS.mapIsActive],
          });
        }}
      />
    </div>
  );
};

const LayoutToggle = ({
  query,
  updateQuery,
  isMobile,
}: {
  updateQuery: (params: TQueryParams) => void;
  query: TQueryParams;
  isMobile?: boolean;
}) => {
  const activeLayout = query[SEARCH_PARAMS.layout];
  return (
    <div
      role="button"
      title={`Switch to ${query[SEARCH_PARAMS.layout] === LayoutView.GRID ? LayoutView.LIST : (LayoutView.GRID as string)} layout`}
      className={`${isMobile ? "flex md:hidden" : "hidden md:flex"} border border-gray-border p-2 items-center justify-center text-dark cursor-pointer`}
      onClick={() =>
        updateQuery({
          [SEARCH_PARAMS.layout]:
            activeLayout === LayoutView.GRID
              ? LayoutView.LIST
              : LayoutView.GRID,
        })
      }
    >
      {activeLayout !== LayoutView.LIST ? (
        <ListIcon className="icon-lg" />
      ) : (
        <CategoryIcon className="icon-lg" />
      )}
    </div>
  );
};

const MobileFilter = ({
  openMobileFilterModal,
}: {
  openMobileFilterModal: () => void;
  isMobile?: boolean;
}) => {
  return (
    <div
      role="button"
      className={
        "flex md:hidden  border border-gray-border p-2 items-center justify-center text-dark cursor-pointer"
      }
      onClick={openMobileFilterModal}
    >
      {<FilterIcon className="icon-lg" />}
    </div>
  );
};

export const ModelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.offset]: 0,
    [SEARCH_PARAMS.searchQuery]:
      searchParams.get(SEARCH_PARAMS.searchQuery) || "",
    [SEARCH_PARAMS.ordering]:
      searchParams.get(SEARCH_PARAMS.ordering) ||
      (ORDERING_FIELDS[1].apiValue as string),
    [SEARCH_PARAMS.mapIsActive]:
      searchParams.get(SEARCH_PARAMS.mapIsActive) || false,
    [SEARCH_PARAMS.startDate]: searchParams.get(SEARCH_PARAMS.startDate) || "",
    [SEARCH_PARAMS.endDate]: searchParams.get(SEARCH_PARAMS.endDate) || "",
    [SEARCH_PARAMS.dateFilter]:
      searchParams.get(SEARCH_PARAMS.dateFilter) || dateFilters[0].searchParams,
    [SEARCH_PARAMS.layout]:
      searchParams.get(SEARCH_PARAMS.layout) || LayoutView.GRID,
    [SEARCH_PARAMS.id]: searchParams.get(SEARCH_PARAMS.id) || "",
  };

  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

  const { isOpened, openDialog, closeDialog } = useDialog();

  const debouncedSearchText = useDebounce(
    query[SEARCH_PARAMS.searchQuery] as string,
    300,
  );

  const { data, isPending, isPlaceholderData } = useModels({
    searchQuery: debouncedSearchText,
    limit: PAGE_LIMIT,
    offset: query[SEARCH_PARAMS.offset] as number,
    orderBy: query[SEARCH_PARAMS.ordering] as string,
    id: query[SEARCH_PARAMS.id] as number,
    dateFilters: buildDateFilterQueryString(
      dateFilters.find(
        (filter) => filter.searchParams === query[SEARCH_PARAMS.dateFilter],
      ),
      query[SEARCH_PARAMS.startDate] as string,
      query[SEARCH_PARAMS.endDate] as string,
    ),
  });

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      setQuery((prevQuery) => ({
        ...prevQuery,
        ...newParams,
      }));
      const updatedParams = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });

      setSearchParams(updatedParams);
    },
    [searchParams, setSearchParams],
  );

  //reset offset back to 0 when searching or when ID filtering is applied from the map.
  useEffect(() => {
    if (
      (query[SEARCH_PARAMS.searchQuery] !== "" ||
        query[SEARCH_PARAMS.id] !== "") &&
      (query[SEARCH_PARAMS.offset] as number) > 0
    ) {
      updateQuery({ [SEARCH_PARAMS.offset]: 0 });
    }
  }, [query]);

  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.offset]: defaultQueries[SEARCH_PARAMS.offset],
      [SEARCH_PARAMS.ordering]: defaultQueries[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.mapIsActive]: defaultQueries[SEARCH_PARAMS.mapIsActive],
      [SEARCH_PARAMS.startDate]: defaultQueries[SEARCH_PARAMS.startDate],
      [SEARCH_PARAMS.endDate]: defaultQueries[SEARCH_PARAMS.endDate],
      [SEARCH_PARAMS.dateFilter]: defaultQueries[SEARCH_PARAMS.dateFilter],
      [SEARCH_PARAMS.layout]: defaultQueries[SEARCH_PARAMS.layout],
      [SEARCH_PARAMS.searchQuery]: defaultQueries[SEARCH_PARAMS.searchQuery],
      [SEARCH_PARAMS.id]: defaultQueries[SEARCH_PARAMS.id],
    };
    setQuery(newQuery);
  }, []);

  const { data: mapData, isPending: modelsMapDataIsPending } =
    useModelsMapData();

  // Since it's just a static filter, it's better to memoize it.
  const memoizedCategoryFilter = useMemo(
    () => <CategoryFilter disabled={isPending} />,
    [isPending],
  );

  const mapViewIsActive = useMemo(
    () => query[SEARCH_PARAMS.mapIsActive],
    [query],
  );

  const clearAllFilters = useCallback(() => {
    const resetParams = new URLSearchParams();
    setSearchParams(resetParams);
    setQuery((prev) => ({
      // Preserve existing query params
      ...prev,
      // Clear only the filter fields
      [SEARCH_PARAMS.searchQuery]: "",
      [SEARCH_PARAMS.startDate]: "",
      [SEARCH_PARAMS.endDate]: "",
      [SEARCH_PARAMS.id]: "",
    }));
  }, []);

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
        <div className="w-full grid md:grid-cols-4 md:border rounded-md p-2 md:border-gray-border gap-x-2 mt-10 grid-rows-2 md:grid-rows-1 gap-y-10 md:gap-y-0 min-h-screen">
          <div className="col-span-1 md:col-span-2 md:row-start-1 grid grid-cols-1 xl:grid-cols-2 gap-x-7 gap-y-14 overflow-scroll">
            <ModelListGridLayout models={data?.results} isPending={isPending} />
          </div>
          <div className="col-span-2 md:col-span-2 row-start-1">
            {modelsMapDataIsPending ? (
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
          <ModelListTableLayout isPending={isPending} models={data?.results} />
        </div>
      );
    }
    return <ModelListGridLayout isPending={isPending} models={data?.results} />;
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
              <SetMapToggle updateQuery={updateQuery} query={query} />
              <LayoutToggle updateQuery={updateQuery} query={query} />
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
          <div className="flex items-center justify-between w-full my-10">
            <div className="w-full flex items-center justify-between">
              <p className="font-semibold text-body-3">
                {data?.count}{" "}
                {
                  APP_CONTENT.models.modelsList.sortingAndPaginationSection
                    .modelCountSuffix
                }
              </p>
              <SetMapToggle query={query} updateQuery={updateQuery} isMobile />
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

        <div
          className={`my-10 ${mapViewIsActive ? "" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-7 gap-y-14"}`}
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
