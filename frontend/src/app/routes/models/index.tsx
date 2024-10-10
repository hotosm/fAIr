import { useModels, useModelsMapData } from "@/features/models/hooks/use-models";
import { ModelsPageSkeleton } from "@/features/models/components"
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategoryIcon, ListIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/form";
import { ModelList, } from "@/features/models/components";
import { ModelsMap } from "@/features/models/components";
import { CategoryFilter, DateRangeFilter, OrderingFilter, SearchFilter } from "@/features/models/components/filters";
import Pagination, { PAGE_LIMIT } from "@/features/models/components/pagination";
import { buildDateFilterQueryString } from "@/utils";
import { PageHeader } from "@/features/models/components/";
import { dateFilters } from "@/features/models/components/filters/date-range-filter";
import { ORDERING_FIELDS } from "@/features/models/components/filters/ordering-filter";
import { FeatureCollection, TQueryParams } from "@/types";


export enum LayoutView {
  LIST = 'list',
  GRID = 'grid'
}


export const SEARCH_PARAMS = {
  startDate: 'start_date',
  endDate: 'end_date',
  mapIsActive: 'map',
  ordering: 'orderBy',
  searchQuery: 'q',
  offset: 'offset',
  dateFilter: 'dateFilter',
  layout: 'layout'
}



const ClearFilters = ({ query, handleClearFilters }: {
  handleClearFilters: (event: React.ChangeEvent<HTMLButtonElement>) => void
  query: TQueryParams
}) => {

  const canClearAllFilters = Boolean(query[SEARCH_PARAMS.searchQuery] || query[SEARCH_PARAMS.startDate] || query[SEARCH_PARAMS.endDate]);

  return (
    <div className="hidden md:block">
      {
        canClearAllFilters ?
          <Button variant="tertiary" size="medium" onClick={handleClearFilters} >
            Clear all
          </Button>
          : null
      }
    </div>
  )
}

const SetMapToggle = ({ query, updateQuery, isMobile }: {
  updateQuery: (params: TQueryParams,) => void
  query: TQueryParams
  isMobile?: boolean
}) => {

  return (
    <div className={`${isMobile ? 'inline-flex md:hidden' : 'hidden md:inline-flex'} items-center gap-x-4`}>
      <p className="text-body-2base">Map View</p>
      <Switch checked={query[SEARCH_PARAMS.mapIsActive] as boolean}
        handleSwitchChange={() => {
          updateQuery({
            [SEARCH_PARAMS.mapIsActive]: !query[SEARCH_PARAMS.mapIsActive]
          })
        }} />
    </div>
  )
}

const LayoutToggle = ({ query, updateQuery, isMobile }: {
  updateQuery: (params: TQueryParams,) => void
  query: TQueryParams
  isMobile?: boolean
}) => {
  const activeLayout = query[SEARCH_PARAMS.layout]
  return (
    <div
      className={`${isMobile ? 'flex md:hidden' : 'hidden md:flex'} border border-gray-border p-2 items-center justify-center text-dark cursor-pointer`}
      onClick={() => updateQuery({
        [SEARCH_PARAMS.layout]: activeLayout === LayoutView.GRID ? LayoutView.LIST : LayoutView.GRID
      })}>
      {activeLayout !== LayoutView.LIST ? <ListIcon /> : <CategoryIcon />}
    </div>
  )
}




export const ModelsPage = () => {


  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.offset]: 0,
    [SEARCH_PARAMS.searchQuery]: searchParams.get(SEARCH_PARAMS.searchQuery) || '',
    [SEARCH_PARAMS.ordering]: searchParams.get(SEARCH_PARAMS.ordering) || ORDERING_FIELDS[0].apiValue as string,
    [SEARCH_PARAMS.mapIsActive]: searchParams.get(SEARCH_PARAMS.mapIsActive) || false,
    [SEARCH_PARAMS.startDate]: searchParams.get(SEARCH_PARAMS.startDate) || '',
    [SEARCH_PARAMS.endDate]: searchParams.get(SEARCH_PARAMS.endDate) || '',
    [SEARCH_PARAMS.dateFilter]: searchParams.get(SEARCH_PARAMS.dateFilter) || dateFilters[0].searchParams,
    [SEARCH_PARAMS.layout]: searchParams.get(SEARCH_PARAMS.layout) || LayoutView.GRID
  }

  const [query, setQuery] = useState<TQueryParams>(defaultQueries);
  const [clearAll, setClearAll] = useState<boolean>(false);

  const { data, isPending, isPlaceholderData } = useModels({
    searchQuery: query[SEARCH_PARAMS.searchQuery] as string,
    limit: PAGE_LIMIT,
    offset: query[SEARCH_PARAMS.offset] as number,
    orderBy: query[SEARCH_PARAMS.ordering] as string,
    dateFilters: buildDateFilterQueryString(
      dateFilters.find(filter => filter.searchParams === query[SEARCH_PARAMS.dateFilter]),
      query[SEARCH_PARAMS.startDate] as string,
      query[SEARCH_PARAMS.endDate] as string
    )
  });


  const updateQuery = useCallback((newParams: TQueryParams) => {

    setQuery((prevQuery) => ({
      ...prevQuery,
      ...newParams
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
  }, [searchParams, setSearchParams]);

  //reset offset back to 0 when searching.
  useEffect(() => {
    if (query[SEARCH_PARAMS.searchQuery] !== '' && query[SEARCH_PARAMS.offset] as number > 0) {
      updateQuery({ [SEARCH_PARAMS.offset]: 0 })
    }
  }, [query])


  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.offset]: defaultQueries[SEARCH_PARAMS.offset],
      [SEARCH_PARAMS.ordering]: defaultQueries[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.mapIsActive]: defaultQueries[SEARCH_PARAMS.mapIsActive],
      [SEARCH_PARAMS.startDate]: defaultQueries[SEARCH_PARAMS.startDate],
      [SEARCH_PARAMS.endDate]: defaultQueries[SEARCH_PARAMS.endDate],
      [SEARCH_PARAMS.dateFilter]: defaultQueries[SEARCH_PARAMS.dateFilter],
      [SEARCH_PARAMS.layout]: defaultQueries[SEARCH_PARAMS.layout],
      [SEARCH_PARAMS.searchQuery]: searchParams.get(SEARCH_PARAMS.searchQuery) || '',
    };
    setQuery(newQuery);
  }, []);


  // pass in map component the filter setter, so it can update the search box with the id here.
  const { data: mapData, isPending: modelMapDataIsPending, } = useModelsMapData();
  console.log(modelMapDataIsPending)
  // Since it's just a static filter, it's better to memoize it.
  const memoizedCategoryFilter = useMemo(() => <CategoryFilter disabled={isPending} />, [isPending])

  const mapViewIsActive = useMemo(() => query[SEARCH_PARAMS.mapIsActive], [query])
  // const isGridLayout = useMemo(() => query[SEARCH_PARAMS.layout], [query])

  const clearAllFilters = useCallback(() => {
    setQuery((prev) => ({
      // Preserve existing non-filter query params
      ...prev,

      // Clear only the filter fields
      [SEARCH_PARAMS.searchQuery]: defaultQueries[SEARCH_PARAMS.searchQuery],
      [SEARCH_PARAMS.startDate]: defaultQueries[SEARCH_PARAMS.startDate],
      [SEARCH_PARAMS.endDate]: defaultQueries[SEARCH_PARAMS.endDate],

      // Keep other params 
      [SEARCH_PARAMS.mapIsActive]: prev[SEARCH_PARAMS.mapIsActive],
      [SEARCH_PARAMS.ordering]: prev[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.layout]: prev[SEARCH_PARAMS.layout],
    }));
    const resetParams = new URLSearchParams();
    setSearchParams(resetParams);
    setClearAll(true);
    setTimeout(() => setClearAll(false), 0);
  }, []);

  const handleClearFilters = () => {
    clearAllFilters();
  };

  const memoizedSearchFilter = useMemo(() => {
    return (
      <SearchFilter
        updateQuery={updateQuery}
        query={query}
        clearAll={clearAll}
      />
    )
  }, [query[SEARCH_PARAMS.searchQuery]])

  return (
    <section className="my-10 min-h-screen">
      <PageHeader />
      <div className=" flex items-center justify-between">
        <div className="flex items-center justify-between gap-x-4">
          {memoizedSearchFilter}
          {memoizedCategoryFilter}
          <LayoutToggle updateQuery={updateQuery} query={query} isMobile />
          <DateRangeFilter
            disabled={isPending}
            updateQuery={updateQuery}
            query={query}
          />
          <ClearFilters query={query} handleClearFilters={handleClearFilters} />
        </div>
        <div className="inline-flex items-center gap-x-12">
          <SetMapToggle updateQuery={updateQuery} query={query} />
          <LayoutToggle updateQuery={updateQuery} query={query} />
        </div>
      </div>

      {
        isPending ?
          <div className="w-full h-10 mt-10 bg-light-gray animate-pulse text-dark"></div>
          :
          <div className="flex items-center justify-between w-full my-10">
            <div className="w-full flex items-center justify-between">
              <p className="font-semibold text-body-3">{data?.count} models</p>
              <SetMapToggle
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
      }

      <div className={`${!mapViewIsActive && '2xl:grid-cols-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-[28px] gap-y-[69.73px]'}`}>
        {
          isPending ?
            <ModelsPageSkeleton layout={LayoutView.GRID} /> :
            mapViewIsActive ?
              <div className="w-full grid md:grid-cols-4 2xl:grid-cols-5 border rounded-md p-2 border-gray-border gap-x-2 mt-10">
                <div className="col-span-1 md:col-span-2  grid grid-cols-1 xl:grid-cols-2 gap-x-[28px] gap-y-[52.73px] overflow-scroll h-[500px]">
                  {/* Filtered model result will be here. So column span will change to accommodate it.
                  Todo - handle skeleton when mapview is activated check if it's pending.
                  Todo - add margin to skeleton for pagination . margin top
                   */}
                  <ModelList models={data?.results} layout={LayoutView.GRID} />
                </div>
                <div className="col-span-2 md:col-span-2 2xl:col-span-3 h-[500px]">
                  <ModelsMap mapResults={mapData as FeatureCollection} updateQuery={updateQuery} />
                </div>
              </div> :
              <ModelList models={data?.results} layout={LayoutView.GRID} />
        }
      </div>
    </section>
  );
};


