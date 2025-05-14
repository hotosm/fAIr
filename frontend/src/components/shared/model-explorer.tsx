import ModelNotFound from "@/features/models/components/model-not-found";
import { Head } from "@/components/seo";
import { LayoutToggle } from "@/features/models/components";
import { LayoutView } from "@/enums";
import { MobileModelFiltersDialog } from "@/features/models/components/dialogs";
import { MODELS_CONTENT } from "@/constants";
import { OrderingFilter, PAGE_LIMIT, SearchFilter } from "@/components/shared";
import { Pagination } from "@/components/shared";
import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { useDialog } from "@/hooks/use-dialog";
import { useModelsListFilters } from "@/features/models/hooks/use-models";
import {
  CategoryFilter,
  ClearFilters,
  DateRangeFilter,
  MobileFilter,
  StatusFilter,
} from "@/features/models/components/filters";

import {
  ModelListGridLayout,
  ModelListTableLayout,
} from "@/features/models/layouts";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { AddIcon } from "@/components/ui/icons";
import { ButtonWithIcon } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ButtonVariant } from "@/enums";

export const ModelExplorer = ({
  title,
  createRoute,
  createButtonAlt,
  userId,
  datasetId,
}: {
  disableCreateNewButton?: boolean;
  title?: string;
  createRoute?: string;
  createButtonAlt?: string;
  userId?: number;
  datasetId?: number;
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
  } = useModelsListFilters(undefined, userId, datasetId);
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
      <Head title={USER_PROFILE_PAGE_CONTENT.models.pageTitle} />
      <section className="min-h-screen gap-y-2 flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-title-3 md:text-title-2 self-start">
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
        <div className="sticky top-0 bg-white z-10 py-1">
          <div className="flex flex-col gap-y-1">
            <div className=" flex items-center justify-between w-full ">
              <div className="flex items-center justify-between w-full md:gap-x-4 gap-y-2 md:gap-y-0  md:w-auto">
                <SearchFilter
                  updateQuery={updateQuery}
                  query={query}
                  placeholder={
                    MODELS_CONTENT.models.modelsList.filtersSection
                      .searchPlaceHolder
                  }
                />
                <CategoryFilter disabled={isPending} />
                <StatusFilter
                  disabled={isPending}
                  updateQuery={updateQuery}
                  query={query}
                />
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
            <div className="flex items-center justify-between w-full my-4 top-16">
              <div className="w-full flex items-center justify-between">
                <p className="font-semibold text-body-3">
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
