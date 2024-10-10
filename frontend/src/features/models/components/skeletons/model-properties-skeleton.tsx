import { SectionTitleSkeleton } from "./models-details-skeleton"

const ModelPropertiesSkeleton = () => {
    return (
        <div className="flex flex-col gap-y-10 w-full">
            <SectionTitleSkeleton />
            <div className="w-full grid grid-cols-5 h-[500px]">
                <div className="col-span-2 grid grid-cols-2 grid-rows-4 gap-6 h-full">
                    {
                        new Array(8).fill(1).map((_, id) =>
                            <div className="row-span-1 col-span-1 flex gap-x-4 flex-col gap-y-2" key={`model-properties-skeleton-${id}`}>
                                <span className="h-[13px] w-[95%] bg-light-gray animate-pulse">
                                </span>
                                <span className="h-[22px] w-full bg-light-gray animate-pulse"></span>
                            </div>)
                    }
                </div>
                <div className="col-span-3 w-full flex justify-end">
                    <div className="h-full w-[500px] bg-light-gray animate-pulse">
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModelPropertiesSkeleton