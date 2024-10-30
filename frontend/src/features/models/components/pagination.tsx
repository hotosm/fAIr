import ChevronDownIcon from "@/components/ui/icons/chevron-down-icon";
import { SEARCH_PARAMS } from "@/app/routes/models";
import { TQueryParams } from "@/types";

export const PAGE_LIMIT = 20;

type PaginationProps = {
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  disableNextPage: boolean;
  disablePrevPage: boolean;
  totalLength?: number;
  pageLimit: number;
  query?: TQueryParams;
  updateQuery?: (params: TQueryParams) => void;
  isPlaceholderData: boolean;
  offset?: number;
  setOffset?: (offset: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  disableNextPage,
  totalLength,
  disablePrevPage,
  pageLimit,
  query,
  updateQuery,
  isPlaceholderData,
  offset,
  setOffset,
}) => {
  const _offset = offset ?? (query?.[SEARCH_PARAMS.offset] as number);

  const onNextPage = () => {
    if (!isPlaceholderData && hasNextPage) {
      const nextOffset = _offset + pageLimit;
      updateQuery?.({
        [SEARCH_PARAMS.offset]: _offset + pageLimit,
      });
      setOffset?.(nextOffset);
    }
  };

  const onPrevPage = () => {
    if (hasPrevPage) {
      const prevOffset = _offset - pageLimit;
      updateQuery?.({
        [SEARCH_PARAMS.offset]: Math.max(prevOffset, 0),
      });
      setOffset?.(Math.max(prevOffset, 0));
    }
  };

  return (
    <div className="flex md:min-w-60 items-center justify-between ">
      <p className="hidden md:inline-block text-body-3">
        <span className="font-semibold ">
          {_offset + 1} -{" "}
          {_offset + pageLimit < (totalLength ? totalLength : 0)
            ? _offset + pageLimit
            : totalLength}
        </span>{" "}
        of {totalLength}
      </p>
      <div className="flex items-center gap-x-10 justify-center w-full md:w-fit md:gap-x-4 ">
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
  );
};

export default Pagination;
