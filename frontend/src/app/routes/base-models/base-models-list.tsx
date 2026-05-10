import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import { AddIcon } from "@/components/ui/icons";
import { SHARED_CONTENT } from "@/constants";
import { ButtonVariant, LayoutView } from "@/enums";
import { useDialog } from "@/hooks/use-dialog";
import { useMemo } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import ContributeModelDialog from "@/features/base-models/components/contribute-model-dialog";
import {
  BaseModelsFilters,
  MobileBaseModelFiltersDialog,
} from "@/features/base-models/components";
import {
  BaseModelGridLayout,
  BaseModelTableLayout,
} from "@/features/base-models/layouts";
import { useBaseModels } from "@/features/base-models/hooks/use-base-models";
import { TBaseModel } from "@/types";
import { DATE_SORT_OPTIONS } from "@/features/base-models/utils/common";

export const BaseModelsPage = () => {
  const { isOpened, openDialog, closeDialog } = useDialog();

  const {
    isOpened: isMobileFiltersOpen,
    openDialog: openMobileFilters,
    closeDialog: closeMobileFilters,
  } = useDialog();

  const [{ q: search, category, date: dateSort, layout }, setQueryStates] =
    useQueryStates({
      q: parseAsString.withDefault(""),
      category: parseAsString.withDefault("all"),
      date: parseAsString.withDefault("newest"),
      layout: parseAsString.withDefault(LayoutView.GRID),
    });

  const isListView = layout === LayoutView.LIST;

  const { data: models = [], isLoading, isError } = useBaseModels();

  /**
   * 1. Dynamically derive categories from STAC models
   */
  const taskCategories = useMemo(() => {
    const uniqueTasks = new Set<string>();

    models.forEach((m: TBaseModel) => {
      if (m.task) uniqueTasks.add(m.task);
    });

    const list = Array.from(uniqueTasks).sort();

    return [
      { label: "All", value: "all" },
      ...list.map((t) => ({
        label: t,
        value: t,
      })),
    ];
  }, [models]);

  /**
   * 2. Filters + sorting
   */
  const filteredModels = useMemo(() => {
    let result = [...models];

    if (search) {
      const searchLower = search.toLowerCase();

      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.description.toLowerCase().includes(searchLower) ||
          model.author.toLowerCase().includes(searchLower),
      );
    }

    if (category && category !== "all") {
      result = result.filter((model) => model.task === category);
    }

    result.sort((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();

      if (dateSort === "oldest") return aDate - bDate;
      return bDate - aDate;
    });

    return result;
  }, [models, search, category, dateSort]);

  /**
   * 3. Dropdown items (dynamic category)
   */
  const categoryMenuItems = useMemo(() => {
    return taskCategories.map((cat) => ({
      value: cat.label,
      apiValue: cat.value,
    }));
  }, [taskCategories]);

  const dateMenuItems = DATE_SORT_OPTIONS.map((opt) => ({
    value: opt.label,
    apiValue: opt.value,
  }));

  const selectedCategoryLabel =
    taskCategories.find((c) => c.value === category)?.label || "Category";

  const selectedDateLabel =
    DATE_SORT_OPTIONS.find((d) => d.value === dateSort)?.label || "Date";

  const toggleLayout = () => {
    setQueryStates({
      layout: isListView ? LayoutView.GRID : LayoutView.LIST,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="py-20 text-center">Loading models...</div>;
    }

    if (isError) {
      return <div className="py-20 text-center">Failed to load models</div>;
    }

    if (filteredModels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-y-4">
          <p className="text-grey text-body-1 font-medium">No models found</p>
          <p className="text-grey text-body-2base">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      );
    }

    if (isListView) {
      return (
        <div className="col-span-5 overflow-x-auto">
          <BaseModelTableLayout models={filteredModels} />
        </div>
      );
    }

    return <BaseModelGridLayout models={filteredModels} />;
  };

  return (
    <>
      <Head title="Base Models" />

      <ContributeModelDialog isOpened={isOpened} closeDialog={closeDialog} />

      <MobileBaseModelFiltersDialog
        isOpened={isMobileFiltersOpen}
        closeDialog={closeMobileFilters}
        categoryMenuItems={categoryMenuItems}
        dateMenuItems={dateMenuItems}
        selectedCategoryLabel={selectedCategoryLabel}
        selectedDateLabel={selectedDateLabel}
        setCategory={(value) => setQueryStates({ category: value })}
        setDateSort={(value) => setQueryStates({ date: value })}
      />

      <section className="my-10 min-h-screen">
        <div className="flex flex-col gap-y-8 my-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-y-4">
            <h1 className="font-semibold text-title-1 text-primary md:text-large-title">
              {SHARED_CONTENT.baseModelsPage.pageHeadingTitle}
            </h1>

            <div className="self-start md:self-auto">
              <ButtonWithIcon
                onClick={openDialog}
                variant={ButtonVariant.PRIMARY}
                prefixIcon={AddIcon}
                label={SHARED_CONTENT.baseModelsPage.pageHeadingButtonText}
              />
            </div>
          </div>

          <p className="max-w-[80%] md:max-w-[50%] text-grey text-body-2base md:text-body-2">
            {SHARED_CONTENT.baseModelsPage.pageHeadingDescription}
          </p>
        </div>

        <BaseModelsFilters
          search={search}
          setSearch={(value) => setQueryStates({ q: value })}
          categoryMenuItems={categoryMenuItems}
          dateMenuItems={dateMenuItems}
          selectedCategoryLabel={selectedCategoryLabel}
          selectedDateLabel={selectedDateLabel}
          setCategory={(value) => setQueryStates({ category: value })}
          setDateSort={(value) => setQueryStates({ date: value })}
          filteredModelsCount={filteredModels.length}
          layout={layout}
          onToggleLayout={toggleLayout}
          onOpenMobileFilters={openMobileFilters}
        />

        {renderContent()}
      </section>
    </>
  );
};
