import ModelNotFound from "@/features/models/components/model-not-found";
import { LayoutToggle } from "@/components/shared/layout-toggle";
import { LayoutView } from "@/enums";
import { MobileModelFiltersDialog } from "@/features/models/components/dialogs";
import { MODELS_CONTENT } from "@/constants";
import {
  ClearFilters,
  OrderingFilter,
  PAGE_LIMIT,
  SearchFilter,
} from "@/components/shared";
import { Pagination } from "@/components/shared";
import { useDialog } from "@/hooks/use-dialog";
import { useModelsListFilters } from "@/features/models/hooks/use-models";
import {
  CategoryFilter,
  DateRangeFilter,
  MobileFilter,
  StatusFilter,
} from "@/features/models/components/filters";
import {
  ModelListGridLayout,
  ModelListTableLayout,
} from "@/features/models/layouts";
import { AddIcon } from "@/components/ui/icons";
import { ButtonWithIcon } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ButtonVariant } from "@/enums";
import { SEARCH_PARAMS } from "@/utils/search-params";

export const ModelExplorer = ({
  title,
  createRoute,
  createButtonAlt,
  userId,
  datasetId,
  disableStatusFilter,
  status,
}: {
  disableCreateNewButton?: boolean;
  title?: string;
  createRoute?: string;
  createButtonAlt?: string;
  userId?: number;
  datasetId?: number;
  disableStatusFilter?: boolean;
  status?: number;
}) => {
  const { isOpened, openDialog, closeDialog } = useDialog();

  const {
    clearAllFilters,
    data,
    isError,
    isPending,
    isPlaceholderData,
    query,
    updateQuery,
  } = useModelsListFilters(status, userId, datasetId);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(createRoute as string);
  };

  const renderContent = () => {
    if (data?.count === 0) {
      return <ModelNotFound />;
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
      <MobileModelFiltersDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        query={query}
        updateQuery={updateQuery}
        disabled={isPending}
      />
      <section className="flex min-h-screen flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <h1 className="self-start text-title-3 font-bold md:text-title-2">
            {title}
          </h1>
          {createRoute && createButtonAlt && (
            <ButtonWithIcon
              onClick={handleClick}
              variant={ButtonVariant.PRIMARY}
              prefixIcon={AddIcon}
              label={createButtonAlt}
            />
          )}
        </div>
        {/* Filters */}
        <div className="sticky top-0 z-10 bg-white py-1">
          <div className="flex flex-col gap-y-1">
            <div className=" flex w-full items-center justify-between ">
              <div className="flex w-full items-center justify-between gap-y-2 md:w-auto md:gap-x-4  md:gap-y-0">
                <SearchFilter
                  updateQuery={updateQuery}
                  query={query}
                  placeholder={
                    MODELS_CONTENT.models.modelsList.filtersSection
                      .searchPlaceHolder
                  }
                />
                <CategoryFilter disabled={isPending} />
                {disableStatusFilter ? null : (
                  <StatusFilter
                    disabled={isPending}
                    updateQuery={updateQuery}
                    query={query}
                  />
                )}
                {/* Mobile filters */}
                <div className="flex items-center gap-x-4 md:hidden">
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
              <div className="hidden items-center gap-x-10 md:flex">
                {/* Desktop */}
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
            <div className="mt-10 h-10 w-full animate-pulse bg-light-gray text-dark"></div>
          ) : (
            <div className="top-16 my-4 flex w-full items-center justify-between">
              <div className="flex w-full items-center justify-between">
                <p className="text-body-3 font-semibold">
                  {data?.count}{" "}
                  {
                    MODELS_CONTENT.models.modelsList.sortingAndPaginationSection
                      .modelCountSuffix
                  }
                </p>
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
        <div className="flex w-full items-center justify-center md:hidden">
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
