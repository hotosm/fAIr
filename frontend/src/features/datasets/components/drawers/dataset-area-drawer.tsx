import React, { useCallback, useEffect } from "react";
import { DialogProps, TTrainingDataset } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements, SHOELACE_SIZES } from "@/enums";
import { useGetTrainingAreas } from "@/features/model-creation/hooks/use-training-areas";
import { useMapInstance } from "@/hooks/use-map-instance";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { extractTileJSONURL } from "@/utils";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";


type TrainingAreaDrawerProps = DialogProps & {
  trainingDataset: TTrainingDataset;
};

export const DatasetAreaDrawer: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  trainingDataset,
}) => {
  const { map } = useMapInstance();
  const {
    // data: trainingAreasData,
    isPending: trainingAreaIsPending,
    isError,
    refetch,
  } = useGetTrainingAreas(trainingDataset.id, 0);

  const tileJSONURL = extractTileJSONURL(trainingDataset?.source_imagery);
  const { data } = useGetTMSTileJSON(tileJSONURL, !!trainingDataset.id);
  const fitToTMSBounds = useCallback(() => {
    if (!map || !data?.bounds) return;
    /**
     * * This is a workaround to fix the map resize issue when the map is loaded especially from the Dataset Edit Drawer.
     */
    map?.resize();
    map?.fitBounds(data?.bounds);
  }, [map, data?.bounds]);

  useEffect(() => {
    if (!map || !data?.bounds) return;
    fitToTMSBounds();
  }, [map, fitToTMSBounds]);

  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={"Dataset Area"}
      noHeader={false}
    >
      <div className="w-full h-full">
        {trainingAreaIsPending && (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <span className="text-grey">Loading dataset areas...</span>
          </div>
        )}

        {isError && (
          <div className="space-y-4 w-fit flex flex-col h-full items-center justify-center mx-auto">
            <p className="text-red-500">Error loading map.</p>
            <Button onClick={() => refetch()} size={SHOELACE_SIZES.MEDIUM}>
              Retry
            </Button>
          </div>
        )}
        {/* {!trainingAreaIsPending && (
          <DatasetAreaMap
            trainingDatasetId={trainingDataset.id}
            map={map}
            mapContainerRef={mapContainerRef}
            data={trainingAreasData}
            trainingAreaIsPending={trainingAreaIsPending}
            // OAMData={data as TileJSON}
            tileJSONURL={tileJSONURL}
          />
        )} */}
      </div>
    </Drawer>
  );
};
