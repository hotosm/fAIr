
import { useModels, useModelsMapData } from "@/features/models/api/get-models";
import { ModelsPageSkeleton } from "@/features/models/components"
import { useToast } from "@/app/providers/toast-provider";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategoryIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { Input, Switch } from "@/components/ui/form";
import { ModelList, ModelsMap } from "@/features/models/components";
import useDebounce from "@/hooks/use-debounce";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";


export enum LayoutView {
  LIST = 'list',
  GRID = 'grid'
}

const PAGE_LIMIT = 20;
// Category

const categoryFilters: DropdownMenuItem[] = [
  {
    value: 'Buildings',
    disabled: true // the endpoint does not support filtering by categories for now, so we'll default to this
  },
  {
    value: 'Roads',
    disabled: true
  },
  {
    value: 'Rivers',
    disabled: true
  },
  {
    value: 'Forest',
    disabled: true
  },
  {
    value: 'All',
    disabled: true
  }
]


const ORDERING_FIELDS: DropdownMenuItem[] = [
  {
    value: 'Oldest Created',
    apiValue: 'created_at',

  },
  {
    value: 'Newest Created',
    apiValue: '-created_at',

  },
  {
    value: 'Oldest Updated',
    apiValue: 'last_modified',

  },
  {
    value: 'Newest Updated',
    apiValue: '-last_modified',

  },
]


// todo - will it be a date picker?
const dateFilters: DropdownMenuItem[] = [
  {
    value: '2024/10/24',
  },
  {
    value: '2025/10/23',
  }
]



export const ModelsPage = () => {

  const { notify } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState<number>(Number(searchParams.get('offset')) || 0);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [date, setDate] = useState<string>(searchParams.get('date') || '');
  const [orderingField, setOrderingField] = useState<string>(searchParams.get('orderBy') || ORDERING_FIELDS[0].apiValue as string);
  const [mapview, setMapview] = useState<boolean>(searchParams.get('map') === 'true');
  const [layoutView, setLayoutView] = useState<LayoutView>(
    //default to grid
    searchParams.get('view') === 'list' ? LayoutView.LIST : LayoutView.GRID
  );

  const debouncedSearchTerm = useDebounce(searchQuery, 300);

  const { data, isPending, error, isPlaceholderData } = useModels({ searchQuery: debouncedSearchTerm, limit: PAGE_LIMIT, offset, orderBy: orderingField });
  const { data: mapData, isPending: modelMapDataIsPending, error: modelsMapDataError } = useModelsMapData()
  console.log(mapData, modelMapDataIsPending, modelsMapDataError)
  const handleNextPage = () => {
    if (!isPlaceholderData && data?.hasNext) {
      setOffset((prevOffset) => prevOffset + PAGE_LIMIT);
    }
  };

  const handlePreviousPage = () => {
    if (data?.hasPrev) {
      setOffset((prevOffset) => Math.max(prevOffset - PAGE_LIMIT, 0));
    }
  };

  // Can be moved to a hook later if it's needed to be used in another component.

  useEffect(() => {
    const params: any = {};
    if (debouncedSearchTerm) {
      params.q = debouncedSearchTerm
      // To reset the offset when a user is searching
      setOffset(0)
    };
    if (date) params.date = date;
    if (offset > 0) params.offset = String(offset);
    params.orderBy = orderingField
    params.map = mapview ? 'true' : 'false';
    params.view = layoutView === LayoutView.GRID ? 'grid' : 'list';
    setSearchParams(params);
  }, [offset, orderingField, debouncedSearchTerm, date, mapview, layoutView]);


  const {
    dropdownIsOpened: categoryDropdownMenuIsOpened,
    onDropdownHide: onCategoryDropdownMenuHide,
    onDropdownShow: onCategoryDropdownMenuShow
  } = useDropdownMenu();

  // Date 
  function handleDateSelection(event: any) {
    const selectedItem: DropdownMenuItem = event.detail.item;
    setDate(selectedItem.value)
  }
  const {
    dropdownIsOpened: dateDropdownMenuIsOpened,
    onDropdownHide: onDateDropdownMenuHide,
    onDropdownShow: onDateDropdownMenuShow
  } = useDropdownMenu();

  // Sort
  const handleOrderingSelection = (selectedItem: string) => {
    setOrderingField(ORDERING_FIELDS.find(v => v.value === selectedItem)?.apiValue as string)
  };

  const {
    dropdownIsOpened: sortDropdownMenuIsOpened,
    onDropdownHide: onSortDropdownMenuHide,
    onDropdownShow: onSortDropdownMenuShow
  } = useDropdownMenu();

  // Search
  const handleSearchInput = useCallback((event: any) => {
    setSearchQuery(event.target.value)
  }, [searchQuery]);

  //layout 
  const handleLayoutView = () => {
    setLayoutView(layoutView === LayoutView.GRID ? LayoutView.LIST : LayoutView.GRID)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDate('')
  }


  // handle error notification ? - handle here or from the query hook?
  if (error) {
    console.error(error);
    notify('An error occured while fetching models. Please try again later.', 'danger');
  }

  return (
    <section className="my-10">
      {/* Header */}
      <ModelPageHeader />
      {/* Filters */}
      <ModelPageFilters
        searchQuery={searchQuery}
        isPending={isPending}
        handleSearchInput={handleSearchInput}
        setMapview={setMapview}
        mapview={mapview}
        date={date}
        dateDropdownMenuIsOpened={dateDropdownMenuIsOpened}
        onDateDropdownMenuHide={onDateDropdownMenuHide}
        onDateDropdownMenuShow={onDateDropdownMenuShow}
        dateFilters={dateFilters}
        handleDateSelection={handleDateSelection}
        onCategoryDropdownMenuHide={onCategoryDropdownMenuHide}
        onCategoryDropdownMenuShow={onCategoryDropdownMenuShow}
        categoryFilters={categoryFilters}
        categoryDropdownMenuIsOpened={categoryDropdownMenuIsOpened}
        layoutView={layoutView}
        handleLayoutView={handleLayoutView}
        clearFilters={clearFilters}
      />

      {/* Paginator and Sort */}
      {/* Todo - when in mapview, this will be disabled, use infinite scrolling for the cards/table  */}
      <ModelPaginatorAndSort totalLength={data?.count}
        parameter="models"
        isPending={isPending}
        hasNextPage={data?.hasNext}
        hasPrevPage={data?.hasPrev}
        handleNextPage={handleNextPage}
        handlePreviousPage={handlePreviousPage}
        offset={offset}
        isPlaceholderData={isPlaceholderData}
        handleOrderingSelection={handleOrderingSelection}
        sortDropdownMenuIsOpened={sortDropdownMenuIsOpened}
        onSortDropdownMenuHide={onSortDropdownMenuHide}
        onSortDropdownMenuShow={onSortDropdownMenuShow}
        orderingField={orderingField}

      />

      <div className={`${!mapview && '2xl:grid-cols-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-[28px] gap-y-[69.73px]'}`}>
        {
          isPending ?
            <ModelsPageSkeleton layout={layoutView} /> :
            mapview ?
              <div className="w-full grid md:grid-cols-4 2xl:grid-cols-5 border rounded-md p-2 border-gray-border gap-x-2 mt-10">
                <div className="col-span-1 md:col-span-2  grid grid-cols-1 xl:grid-cols-2 gap-x-[28px] gap-y-[52.73px] overflow-scroll h-[500px]">
                  {/* Filtered model result will be here. So column span will change to accommodate it.
                  Todo - handle skeleton when mapview is activated
                  Todo - add margin to skeleton for pagination . margin top
                   */}
                  <ModelList models={data?.results} layout={layoutView} />
                </div>
                <div className="col-span-2 md:col-span-2 2xl:col-span-3 h-[500px]">
                  <ModelsMap mapResults={mapData} />
                </div>
              </div> :
              <ModelList models={data?.results} layout={layoutView} />
        }
      </div>
    </section>
  );
};




type PaginatorProps = {
  isPending: boolean
  totalLength?: number
  parameter: string
  offset: number,
  hasNextPage?: boolean
  hasPrevPage?: boolean
  handleNextPage: () => void
  handlePreviousPage: () => void
  isPlaceholderData: boolean
  handleOrderingSelection: (selectedItem: string) => void
  sortDropdownMenuIsOpened: boolean
  onSortDropdownMenuHide: () => void
  onSortDropdownMenuShow: () => void
  orderingField: string
}
const ModelPaginatorAndSort: React.FC<PaginatorProps> = (
  { handleNextPage,
    handlePreviousPage,
    offset,
    isPending,
    totalLength,
    parameter,
    hasNextPage,
    hasPrevPage,
    isPlaceholderData,
    handleOrderingSelection,
    sortDropdownMenuIsOpened,
    onSortDropdownMenuHide,
    onSortDropdownMenuShow, orderingField
  }
) => {

  return (
    <>
      {
        isPending ?
          <div className="w-full h-10 mt-10 bg-light-gray animate-pulse text-dark"></div>
          :
          <div className="flex items-center justify-between w-full my-10">
            <div>
              <p className="font-semibold text-body-3">{totalLength} {parameter}</p>
            </div>
            <div className="flex items-center gap-x-9">
              {/* Sort */}
              <div>
                <DropDown
                  menuItems={ORDERING_FIELDS}
                  dropdownIsOpened={sortDropdownMenuIsOpened}
                  onDropdownHide={onSortDropdownMenuHide}
                  onDropdownShow={onSortDropdownMenuShow}
                  handleMenuSelection={handleOrderingSelection}
                  chevronClassName="text-[#404446]"
                  disabled={isPending}
                  withCheckbox
                  defaultSelectedItem={ORDERING_FIELDS.find(v => v.apiValue === orderingField)?.value}
                >
                  <p className="text-sm text-[#404446] text-nowrap">Sort by</p>
                </DropDown>
              </div>

              {/* Paginator */}
              <div className="flex min-w-[216px] items-center justify-between ">
                <p className="text-body-3">
                  <span className="font-semibold ">{offset + 1} - {offset + PAGE_LIMIT < (totalLength ? totalLength : 0) ? offset + PAGE_LIMIT : totalLength}</span> of {totalLength}
                </p>
                <div className="flex items-center gap-x-4 ">
                  <button className="w-4 cursor-pointer" title="Prev" disabled={!hasPrevPage} onClick={handlePreviousPage}>
                    <ChevronDownIcon className={`rotate-90  ${hasPrevPage ? 'text-dark' : 'text-light-gray'}`} />
                  </button>
                  <button className="w-4 cursor-pointer" title="Next" disabled={!hasNextPage || isPlaceholderData} onClick={handleNextPage}>
                    <ChevronDownIcon className={`-rotate-90  ${hasNextPage ? 'text-dark' : 'text-light-gray'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
      }
    </>
  )
}


const ModelPageHeader = () => {
  return (
    <div className="flex flex-col gap-y-8 my-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-primary md:text-large-title">fAIr AI models</h1>
        </div>
        <div>
          <Button variant="primary" create>
            Create Model
          </Button>
        </div>
      </div>
      <p className="max-w-[50%] text-gray text-body-2">
        Each model is trained using one of the training datasets. Published models can be used to find mappable features in imagery that is similar to the training areas that dataset comes from.
      </p>
    </div>
  )
}

type ModelPageFiltersProps = {
  searchQuery: string
  handleSearchInput: (args: string) => void
  isPending: boolean
  categoryFilters: DropdownMenuItem[]
  categoryDropdownMenuIsOpened: boolean
  onCategoryDropdownMenuShow: () => void
  onCategoryDropdownMenuHide: () => void
  dateFilters: DropdownMenuItem[]
  dateDropdownMenuIsOpened: boolean
  onDateDropdownMenuHide: () => void
  onDateDropdownMenuShow: () => void
  handleDateSelection: (event: string) => void
  date: string
  mapview: boolean
  setMapview: (arg: boolean) => void
  layoutView: LayoutView
  handleLayoutView: (event: any) => void
  clearFilters: () => void

}

const ModelPageFilters: React.FC<ModelPageFiltersProps> = (
  {
    setMapview,
    mapview,
    date,
    handleDateSelection,
    onDateDropdownMenuShow,
    onDateDropdownMenuHide,
    dateDropdownMenuIsOpened,
    dateFilters,
    onCategoryDropdownMenuHide,
    onCategoryDropdownMenuShow,
    searchQuery,
    handleSearchInput,
    isPending,
    categoryFilters,
    categoryDropdownMenuIsOpened,
    layoutView,
    handleLayoutView, clearFilters
  }) => {

  const canClearFilters = date && searchQuery;

  return (
    <div className=" flex items-center justify-between">
      <div className="flex items-center gap-x-4">
        {/* Search */}
        <div className="flex items-center  px-4 w-full border border-gray-border">
          <SearchIcon className="w-6 h-6" />
          <Input
            handleInput={handleSearchInput}
            value={searchQuery}
            placeholder="Search"
            clearable
          />
        </div>

        {/* Categories */}
        <div className="border border-gray-border py-2 px-4">
          <DropDown
            menuItems={categoryFilters}
            dropdownIsOpened={categoryDropdownMenuIsOpened}
            onDropdownHide={onCategoryDropdownMenuHide}
            onDropdownShow={onCategoryDropdownMenuShow}
            handleMenuSelection={() => null}
            chevronClassName="text-[#404446]"
            disabled={isPending}
            withCheckbox
            defaultSelectedItem={categoryFilters[0].value}
            menuItemTextSize="small"
          >
            <p className="text-sm text-[#404446] text-nowrap">{categoryFilters[0].value}</p>
          </DropDown>
        </div>


        {/* Date */}
        <div className="border border-gray-border py-2 px-4">
          <DropDown
            menuItems={dateFilters}
            dropdownIsOpened={dateDropdownMenuIsOpened}
            onDropdownHide={onDateDropdownMenuHide}
            onDropdownShow={onDateDropdownMenuShow}
            handleMenuSelection={handleDateSelection}
            chevronClassName="text-[#404446]"
            disabled={isPending}
          >
            <p className="text-sm text-[#404446] text-nowrap">{date ? date : 'Date'}</p>
          </DropDown>
        </div>
        {/* Clear button */}
        {
          canClearFilters &&
          (
            <Button variant="tertiary" size="medium" onClick={clearFilters} >
              Clear all
            </Button>
          )
        }

      </div>


      <div className="inline-flex items-center gap-x-12">
        <div className="inline-flex items-center gap-x-4">
          <p>Map View</p>
          <Switch checked={mapview}
            handleSwitchChange={() => {
              setMapview(!mapview)
            }} />
        </div>
        <div
          className="border border-gray-border p-2 flex items-center justify-center text-[#404446] cursor-pointer"
          onClick={handleLayoutView}>
          {layoutView !== LayoutView.LIST ? <ListIcon /> : <CategoryIcon />}
        </div>
      </div>
    </div>
  )
}