const ModelsPageSkeleton = () => {
    return (
        <div className="grid grid-cols-12 gap-x-[28px] gap-y-[69.73px]">
            {
                new Array(16).fill(1).map(_ =>
                    <div className="col-span-3 max-w-[299px] min-h-[300px] flex flex-col gap-y-[30px]">
                        <div className="flex flex-col gap-y-[13px]">
                            <div className="w-[299px] h-[208px] bg-light-gray animate-pulse"></div>
                            <div className="flex justify-between items-center">
                                <div className="w-[168px] h-[16.91px] bg-light-gray animate-pulse"></div>
                                <div className="w-[22.54px] h-[16.91px] bg-light-gray animate-pulse"></div>
                            </div>
                            <div className="w-[67.79px] h-[16.91px] bg-light-gray animate-pulse"></div>
                        </div>

                        <div className="w-[269px] h-[69.51px] bg-light-gray animate-pulse"></div>

                        <div className="flex flex-col gap-y-[13px]">
                            <div className="w-[116.79px] h-[14.94px] bg-light-gray animate-pulse"></div>
                            <div className="w-[168.79px] h-[14.94px] bg-light-gray animate-pulse"></div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}


export default ModelsPageSkeleton