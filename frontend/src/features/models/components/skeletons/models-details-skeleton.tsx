import { ModelInfoSkeleton } from "./model-info-skeleton";
import ModelPropertiesSkeleton from "./model-properties-skeleton";

export const SectionTitleSkeleton = () => {
  return <div className="h-10 max-w-sm bg-light-gray animate-pulse"></div>;
};

const TrainingHistorySkeleton = () => {
  return (
    <div className="w-full h-[400px] flex flex-col gap-y-10">
      <div className="flex justify-between items-center w-full">
        <div className="h-10 w-full max-w-sm bg-light-gray animate-pulse"></div>
        <div className="h-10 w-full max-w-sm bg-light-gray animate-pulse"></div>
      </div>
      <div className="w-full h-full bg-light-gray animate-pulse"></div>
    </div>
  );
};

const ModelDetailsSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-20 my-10">
      <ModelInfoSkeleton />
      <ModelPropertiesSkeleton />
      <TrainingHistorySkeleton />
    </div>
  );
};

export default ModelDetailsSkeleton;
