import React from "react";
import { DialogProps, TTrainingDataset } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { DatasetAreaContent } from "@/features/datasets/components/dataset-area-content";

type TrainingAreaDrawerProps = DialogProps & {
  trainingDataset: TTrainingDataset;
};

export const DatasetAreaDrawer: React.FC<TrainingAreaDrawerProps> = ({
  isOpened,
  closeDialog,
  trainingDataset,
}) => {
  return (
    <Drawer
      open={isOpened}
      setOpen={closeDialog}
      placement={DrawerPlacements.BOTTOM}
      label={"Dataset Area"}
      noHeader={false}
    >
      {isOpened && <DatasetAreaContent trainingDataset={trainingDataset} />}
    </Drawer>
  );
};
