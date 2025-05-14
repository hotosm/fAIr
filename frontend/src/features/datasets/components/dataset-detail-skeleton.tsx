import { ModelInfoSkeleton } from "@/features/models/components/skeletons/model-info-skeleton";
import { ModelListSkeleton } from "@/features/models/components/skeletons/model-list-skeleton";

export const DatasetDetailSkeleton = () => {
  return (
    <div className="my-10">
      <ModelInfoSkeleton />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-4 gap-y-10">
        <ModelListSkeleton />
      </div>
    </div>
  );
};
