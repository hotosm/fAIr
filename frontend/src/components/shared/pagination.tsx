import { ChevronDownIcon } from "@/components/ui/icons";
import { TQueryParams } from "@/types";
import { useScrollToTop } from "@/hooks/use-scroll-to-element";
import { SEARCH_PARAMS } from "@/utils/search-params";

export const PAGE_LIMIT = 20;

type PaginationProps = {
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  disableNextPage: boolean;
  disablePrevPage: boolean;
  totalLength?: number;
  pageLimit?: number;
  query?: TQueryParams;
  updateQuery?: (params: TQueryParams) => void;
  isPlaceholderData?: boolean;
  offset?: number;
  setOffset?: (offset: number) => void;
  showCountOnMobile?: boolean;
  centerOnMobile?: boolean;
  scrollToTopOnPageSwitch?: boolean;
};

export const Pagination: React.FC<PaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  disableNextPage,
  totalLength = 0,
  disablePrevPage,
  pageLimit = PAGE_LIMIT,
  query,
  updateQuery,
  isPlaceholderData,
  offset,
  setOffset,
  showCountOnMobile = false,
  centerOnMobile = true,
  scrollToTopOnPageSwitch = false,
}) => {
  const _offset = offset ?? (query?.[SEARCH_PARAMS.offset] as number);
  const { scrollToTop } = useScrollToTop();
  const onNextPage = () => {
    if (!isPlaceholderData && hasNextPage) {
      const nextOffset = _offset + pageLimit;
      updateQuery?.({
        [SEARCH_PARAMS.offset]: _offset + pageLimit,
      });
      setOffset?.(nextOffset);
      // scroll to top only on models page
      if (scrollToTopOnPageSwitch) {
        scrollToTop();
      }
    }
  };

  const onPrevPage = () => {
    if (hasPrevPage) {
      const prevOffset = _offset - pageLimit;
      updateQuery?.({
        [SEARCH_PARAMS.offset]: Math.max(prevOffset, 0),
      });
      setOffset?.(Math.max(prevOffset, 0));
      // scroll to top only on models page
      if (scrollToTopOnPageSwitch) {
        scrollToTop();
      }
    }
  };

  return (
    <div
      className={`flex w-full items-center gap-x-2 ${centerOnMobile ? "justify-center" : "justify-between"}`}
    >
      <div>
        <p
          className={`"text-body-4 mr-1 text-nowrap md:inline-block  ${showCountOnMobile ? "inline-block" : "hidden"}`}
        >
          <span className="text-body-4 md:font-semibold">
            {totalLength > 0 ? _offset + 1 : 0} -{" "}
            {_offset + pageLimit < (totalLength ? totalLength : 0)
              ? _offset + pageLimit
              : totalLength}
          </span>{" "}
          <span className="text-body-4 md:font-semibold">
            {" "}
            of {totalLength}
          </span>
        </p>
      </div>
      <div>
        <div className="flex w-full items-center justify-between gap-x-4 md:w-fit ">
          <button
            className="w-4 cursor-pointer"
            title="Prev"
            disabled={disablePrevPage}
            onClick={onPrevPage}
          >
            <ChevronDownIcon
              className={`rotate-90  ${hasPrevPage ? "text-dark" : "text-light-gray"}`}
            />
          </button>
          <button
            className="w-4 cursor-pointer"
            title="Next"
            disabled={disableNextPage}
            onClick={onNextPage}
          >
            <ChevronDownIcon
              className={`-rotate-90  ${hasNextPage ? "text-dark" : "text-light-gray"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
