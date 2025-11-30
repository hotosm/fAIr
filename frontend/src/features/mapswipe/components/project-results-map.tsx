import { DialogProps } from "@/types";
import { TrainingAreaMap } from "@/features/models/components";
import { DrawerPlacements } from "@/enums";
import { Drawer } from "@/components/ui/drawer";

type PredictionResultProps = DialogProps & {
  predictionId: number;
  tileServiceUrl: string;
  folder?: string;
  pmtilesUrl: string;
};

export const MapSwipeProjectResultMapDrawer: React.FC<
  PredictionResultProps
> = ({ isOpened, closeDialog, predictionId, tileServiceUrl, pmtilesUrl }) => {
  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={"Results Map"}
      noHeader={false}
    >
      <div className="w-full flex items-center justify-center h-full">
        {tileServiceUrl && (
          <div className="flex w-full h-full flex-col space-y-4">
            <div className="w-full h-full relative border">
              <TrainingAreaMap
                tmsURL={tileServiceUrl}
                trainingAreaId={predictionId}
                visible={isOpened}
                file={pmtilesUrl}
                isPredictionResult
              />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
