import { LayoutView } from "@/enums";
import { MODELS_CONTENT } from "@/constants";
import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { Switch } from "@/components/ui/form";
import { TQueryParams } from "@/types";

const ModelMapToggle = ({
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
        {MODELS_CONTENT.models.modelsList.filtersSection.mapViewToggleText}
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

export default ModelMapToggle;
