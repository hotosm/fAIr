import { SectionTitleSkeleton } from "./models-details-skeleton";

const ModelPropertiesSkeleton = ({
  isTrainingDetailsDialog,
}: {
  isTrainingDetailsDialog?: boolean;
}) => {
  return (
    <div className="flex w-full flex-col gap-y-10">
      <SectionTitleSkeleton />
      <div className="grid h-[500px] w-full grid-cols-1 md:grid-cols-5">
        <div className="col-span-2 grid h-full grid-cols-2 grid-rows-4 gap-6">
          {new Array(8).fill(1).map((_, id) => (
            <div
              className="col-span-1 row-span-1 flex flex-col gap-x-4 gap-y-2"
              key={`model-properties-skeleton-${id}`}
            >
              <span className="h-[13px] w-[95%] animate-pulse bg-light-gray"></span>
              <span className="h-[22px] w-full animate-pulse bg-light-gray"></span>
            </div>
          ))}
        </div>
        <div
          className={`${isTrainingDetailsDialog ? "hidden" : "flex"} col-span-3 w-full justify-end`}
        >
          <div className="h-full w-[500px] animate-pulse bg-light-gray"></div>
        </div>
      </div>
    </div>
  );
};

export default ModelPropertiesSkeleton;
