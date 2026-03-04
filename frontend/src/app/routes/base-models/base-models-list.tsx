import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import { AddIcon } from "@/components/ui/icons";
import { SHARED_CONTENT } from "@/constants";
import { ButtonVariant } from "@/enums";
import {
  BASE_MODELS_DATA,
  TASK_CATEGORIES,
  DATE_SORT_OPTIONS,
} from "@/utils/base-model-data";
import { useDialog } from "@/hooks/use-dialog";
import { useMemo } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import BaseModelCard from "@/features/base-models/components/base-model-card";
import ContributeModelDialog from "@/features/base-models/components/contribute-model-dialog";
import BaseModelsFilters from "@/features/base-models/components/base-models-filters";

export const BaseModelsPage = () => {
  const { isOpened, openDialog, closeDialog } = useDialog();
  // nuqs-powered search params state
  const [
    { q: search, category, date: dateSort, map: mapView },
    setQueryStates,
  ] = useQueryStates({
    q: parseAsString.withDefault(""),
    category: parseAsString.withDefault("all"),
    date: parseAsString.withDefault("newest"),
    map: parseAsString.withDefault("false"),
  });

  const isMapViewActive = mapView === "true";

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let models = [...BASE_MODELS_DATA];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.description.toLowerCase().includes(searchLower) ||
          model.author.toLowerCase().includes(searchLower),
      );
    }

    // Category filter
    if (category !== "all") {
      models = models.filter((model) => model.task === category);
    }

    // Date sorting
    if (dateSort === "oldest") {
      models.reverse();
    }

    return models;
  }, [search, category, dateSort]);

  // Category dropdown items
  const categoryMenuItems = TASK_CATEGORIES.map((cat) => ({
    value: cat.label,
    apiValue: cat.value,
  }));

  // Date dropdown items
  const dateMenuItems = DATE_SORT_OPTIONS.map((opt) => ({
    value: opt.label,
    apiValue: opt.value,
  }));

  const selectedCategoryLabel =
    TASK_CATEGORIES.find((c) => c.value === category)?.label || "Category";

  const selectedDateLabel =
    DATE_SORT_OPTIONS.find((d) => d.value === dateSort)?.label || "Date";
  return (
    <>
      <Head title="Base Models" />
      <ContributeModelDialog isOpened={isOpened} closeDialog={closeDialog} />

      <section className="my-10 min-h-screen">
        {/* Header */}
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
          isMapViewActive={isMapViewActive}
          setMapView={(value) => setQueryStates({ map: value })}
          filteredModelsCount={filteredModels.length}
        />

        {filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-y-4">
            <p className="text-grey text-body-1 font-medium">No models found</p>
            <p className="text-grey text-body-2base">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <BaseModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
