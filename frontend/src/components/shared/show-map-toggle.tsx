import { LayoutView } from "@/enums";
import { MODELS_CONTENT } from "@/constants";
import { Switch } from "@/components/ui/form";
import { TQueryParams } from "@/types";
import { SEARCH_PARAMS } from "@/utils/search-params";

/**
 * ShowMapToggle component is used to toggle between map and list view.
 * It is used in the ModelsList page.
 * @param query - The current query parameters.
 * @param updateQuery - The function to update the query parameters.
 * @param isMobile - Optional prop to determine if the component should be displayed in mobile view.
 */
const ShowMapToggle = ({
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
      className={[
        "items-center gap-x-4",
        isMobile === true
          ? "inline-flex md:hidden"
          : isMobile === false
            ? "hidden md:inline-flex"
            : "inline-flex",
      ].join(" ")}
    >
      <p className="text-body-2base text-nowrap">
        {MODELS_CONTENT.models.modelsList.filtersSection.mapViewToggleText}
      </p>
      <Switch
        checked={query[SEARCH_PARAMS.mapIsActive] as boolean}
        /**
         * The switch is disabled when the layout is set to LIST view.
         * This will only be active on any parent component that has the layout view set to LIST.
         * E.g ModelsList page.
         */
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

export default ShowMapToggle;
