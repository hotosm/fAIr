import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DatasetAreaMap } from "./dataset-area-map";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useGetTrainingAreas } from "@/features/model-creation/hooks/use-training-areas";
import { TTrainingDataset } from "@/types";
import { SHOELACE_SIZES } from "@/enums";

export const DatasetAreaContent: React.FC<{
  trainingDataset: TTrainingDataset;
}> = ({ trainingDataset }) => {
  const { map, mapContainerRef } = useMapInstance();

  const {
    data: trainingAreasData,
    isPending: trainingAreaIsPending,
    isError,
    refetch,
  } = useGetTrainingAreas(trainingDataset.id, 0);

  return (
    <div className="size-full">
      {trainingAreaIsPending && (
        <div className="flex h-full flex-col items-center justify-center">
          <Spinner />
          <span className="text-grey">Loading dataset area...</span>
        </div>
      )}

      {isError && (
        <div className="mx-auto flex h-full w-fit flex-col items-center justify-center space-y-4">
          <p className="text-red-500">Error loading dataset area.</p>
          <Button onClick={() => refetch()} size={SHOELACE_SIZES.SMALL}>
            Retry
          </Button>
        </div>
      )}

      <DatasetAreaMap
        trainingDatasetId={trainingDataset.id}
        map={map}
        mapContainerRef={mapContainerRef}
        data={trainingAreasData}
        trainingAreaIsPending={trainingAreaIsPending}
        tileServiceURL={trainingDataset?.source_imagery}
      />
    </div>
  );
};
