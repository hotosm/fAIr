import { CategoryIcon, ListIcon } from "@/components/ui/icons";
import { LayoutView } from "@/enums";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { TQueryParams } from "@/types";
import { useScrollToTop } from "@/hooks/use-scroll-to-element";
import { ToolTip } from "@/components/ui/tooltip";

export const LayoutToggle = ({
  query,
  updateQuery,
  isMobile,
  disabled = false,
  iconSize = "icon-lg",
}: {
  updateQuery: (params: TQueryParams) => void;
  query: TQueryParams;
  isMobile?: boolean;
  disabled?: boolean;
  iconSize?: string;
}) => {
  const activeLayout = query[SEARCH_PARAMS.layout];
  const { scrollToTop } = useScrollToTop();
  return (
    <ToolTip
      content={`${disabled ? "Toggle off mapview to show as" : "Show as"} ${query[SEARCH_PARAMS.layout] === LayoutView.GRID ? LayoutView.LIST : (LayoutView.GRID as string)}`}
    >
      <button
        className={`${isMobile ? "flex md:hidden" : "hidden md:flex"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} border border-gray-border p-2 items-center justify-center text-dark`}
        onClick={() => {
          updateQuery({
            [SEARCH_PARAMS.layout]:
              activeLayout === LayoutView.GRID
                ? LayoutView.LIST
                : LayoutView.GRID,
          });
          scrollToTop();
        }}
        disabled={disabled}
      >
        {activeLayout !== LayoutView.LIST ? (
          <ListIcon className={iconSize} />
        ) : (
          <CategoryIcon className={iconSize} />
        )}
      </button>
    </ToolTip>
  );
};
