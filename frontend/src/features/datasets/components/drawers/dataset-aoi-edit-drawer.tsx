import React from "react";
import { DialogProps, TTrainingDataset } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { TrainingAreaForm } from "@/features/model-creation/components";

type TrainingAreaDrawerProps = DialogProps & {
  trainingDataset: TTrainingDataset;
};

export const DatasetAOIEditDrawer: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  trainingDataset,
}) => {
  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={"Edit Area of Interest"}
      noHeader={false}
    >
      <div className="size-full">
        {isOpened && (
          <TrainingAreaForm
            isDatasetEditMode
            trainingDataset={trainingDataset}
          />
        )}
      </div>
    </Drawer>
  );
};
