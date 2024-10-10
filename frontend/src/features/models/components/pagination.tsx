import ChevronDownIcon from "@/components/ui/icons/chevron-down"
import { SEARCH_PARAMS } from "@/app/routes/models"
import { TQueryParams } from "@/types";




export const PAGE_LIMIT = 20;


type PaginationProps = {
    hasNextPage?: boolean
    hasPrevPage?: boolean
    disableNextPage: boolean
    disablePrevPage: boolean
    totalLength?: number
    pageLimit: number
    query: TQueryParams
    updateQuery: (params: TQueryParams,) => void
    isPlaceholderData: boolean
}


const Pagination: React.FC<PaginationProps> = ({
    hasNextPage,
    hasPrevPage,
    disableNextPage,
    totalLength,
    disablePrevPage,
    pageLimit,
    query,
    updateQuery,
    isPlaceholderData
}) => {

    const offset = query[SEARCH_PARAMS.offset] as number

    const onNextPage = () => {
        console.log('here', offset + PAGE_LIMIT)
        if (!isPlaceholderData && hasNextPage) {
            updateQuery({
                [SEARCH_PARAMS.offset]: offset + PAGE_LIMIT
            })

        }
    };

    const onPrevPage = () => {
        if (hasPrevPage) {
            console.log('here', offset ?? 0 + Math.max(offset - PAGE_LIMIT, 0))
            updateQuery({
                [SEARCH_PARAMS.offset]: Math.max(offset - PAGE_LIMIT, 0)
            })

        }
    };


    return (
        <div className="hidden md:flex min-w-[216px] items-center justify-between ">
            <p className="hidden md:inline-block text-body-3">
                <span className="font-semibold ">{offset + 1} - {offset + pageLimit < (totalLength ? totalLength : 0) ? offset + pageLimit : totalLength}</span> of {totalLength}
            </p>
            <div className="flex items-center gap-x-4 ">
                <button className="w-4 cursor-pointer" title="Prev" disabled={disablePrevPage} onClick={onPrevPage}>
                    <ChevronDownIcon className={`rotate-90  ${hasPrevPage ? 'text-dark' : 'text-light-gray'}`} />
                </button>
                <button className="w-4 cursor-pointer" title="Next" disabled={disableNextPage} onClick={onNextPage}>
                    <ChevronDownIcon className={`-rotate-90  ${hasNextPage ? 'text-dark' : 'text-light-gray'}`} />
                </button>
            </div>
        </div>
    )
}

export default Pagination