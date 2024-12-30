import { CategoryIcon, ListIcon } from '@/components/ui/icons';
import { LayoutView } from '@/enums';
import { SEARCH_PARAMS } from '@/app/routes/models/models-list';
import { TQueryParams } from '@/types';
import { useScrollToTop } from '@/hooks/use-scroll-to-element';

const LayoutToggle = ({
  query,
  updateQuery,
  isMobile,
  disabled = false,
}: {
  updateQuery: (params: TQueryParams) => void;
  query: TQueryParams;
  isMobile?: boolean;
  disabled?: boolean;
}) => {
  const activeLayout = query[SEARCH_PARAMS.layout];
  const { scrollToTop } = useScrollToTop();
  return (
    <button
      title={`Switch to ${query[SEARCH_PARAMS.layout] === LayoutView.GRID ? LayoutView.LIST : (LayoutView.GRID as string)} layout`}
      className={`${isMobile ? "flex md:hidden" : "hidden md:flex"} border border-gray-border p-2 items-center justify-center text-dark cursor-pointer`}
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
        <ListIcon className="icon-lg" />
      ) : (
        <CategoryIcon className="icon-lg" />
      )}
    </button>
  );
};

export default LayoutToggle;
