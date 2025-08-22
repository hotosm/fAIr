import { ModelInfoSkeleton } from "./model-info-skeleton";
import ModelPropertiesSkeleton from "./model-properties-skeleton";

export const SectionTitleSkeleton = () => {
  return <div className="h-10 max-w-sm animate-pulse bg-light-gray"></div>;
};

const TrainingHistorySkeleton = () => {
  return (
    <div className="flex h-[400px] w-full flex-col gap-y-10">
      <div className="flex w-full items-center justify-between">
        <div className="h-10 w-full max-w-sm animate-pulse bg-light-gray"></div>
        <div className="h-10 w-full max-w-sm animate-pulse bg-light-gray"></div>
      </div>
      <div className="size-full animate-pulse bg-light-gray"></div>
    </div>
  );
};

const ModelDetailsSkeleton = () => {
  return (
    <div className="my-10 flex flex-col gap-y-20">
      <ModelInfoSkeleton />
      <ModelPropertiesSkeleton />
      <TrainingHistorySkeleton />
    </div>
  );
};

export default ModelDetailsSkeleton;
