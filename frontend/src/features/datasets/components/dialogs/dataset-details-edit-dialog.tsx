import { Dialog } from "@/components/ui/dialog";
import { TTrainingDataset } from "@/types";
import { NewTrainingDatasetForm } from "@/features/model-creation/components/training-dataset/training-dataset-form";
import { useTileservice } from "@/hooks/use-tileservice";
import { getTileServerRegex, getTileServerTypeFromURL } from "@/utils";

type DatasetEditDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
  data: TTrainingDataset;
};
export const DatasetEditDialog: React.FC<DatasetEditDialogProps> = ({
  isOpened,
  closeDialog,
  data,
}) => {
  const {
    tileServiceType,
    setTileServiceType,
    tileserverURL,
    setTileserverURL,
    tileJSONMetadata,
    tileServiceTypeValidity,
    setTileServiceTypeValidity,
    loading,
  } = useTileservice(getTileServerTypeFromURL(data.source_imagery), data.source_imagery);

  getTileServerRegex;
  return (
    <Dialog isOpened={isOpened} closeDialog={closeDialog} label={"Edit Dataset Details"}>
      <div className="w-full">
        <NewTrainingDatasetForm
          datasetName={data.name}
          tileServiceType={tileServiceType}
          onSuccess={() => {
            closeDialog();
          }}
          setTileServiceType={setTileServiceType}
          setTileServiceTypeValidity={setTileServiceTypeValidity}
          tileServiceTypeValidity={tileServiceTypeValidity}
          setTileserverURL={setTileserverURL}
          tileserverURL={tileserverURL}
          loading={loading}
          tileJSONMetadata={tileJSONMetadata}
          buttonText="Update Dataset"
          trainingDatasetId={data.id}
        />
      </div>
    </Dialog>
  );
};
