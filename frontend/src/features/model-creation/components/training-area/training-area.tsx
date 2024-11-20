import { UploadIcon, YouTubePlayIcon } from "@/components/ui/icons";
import { StepHeading } from "@/features/model-creation/components/";
import TrainingAreaMap from "@/features/model-creation/components/training-area/training-area-map";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import { useDialog } from "@/hooks/use-dialog";
import FileUploadDialog from "@/features/model-creation/components/dialogs/file-upload-dialog";
import { useEffect, useState } from "react";
import TrainingAreaList from "@/features/model-creation/components/training-area/training-area-list";
import {
  useCreateTrainingArea,
  useGetTrainingAreas,
} from "@/features/model-creation/hooks/use-training-areas";
import OpenAerialMap from "@/features/model-creation/components/training-area/open-area-map";
import { useMap } from "@/app/providers/map-provider";
import {
  MODEL_CREATION_CONTENT,
  showSuccessToast,
  snapGeoJSONGeometryToClosestTile,
  TOAST_NOTIFICATIONS,
} from "@/utils";
import { DrawingModes } from "@/enums";
import { GeoJSONType, Geometry } from "@/types";
import { geojsonToWKT } from "@terraformer/wkt";

const TrainingAreaForm = () => {
  const { formData } = useModelsContext();

  const tileJSONURL = formData.tmsURL.split("/{z}/{x}/{y}")[0];

  const { closeDialog, isOpened, toggle } = useDialog();
  const { handleChange } = useModelsContext();
  const [offset, setOffset] = useState<number>(0);
  const { setDrawingMode } = useMap();
  const {
    data: trainingAreasData,
    isPending: trainingAreaIsPending,
    isPlaceholderData,
  } = useGetTrainingAreas(Number(formData.selectedTrainingDatasetId), offset);

  useEffect(() => {
    if (!trainingAreasData) return;
    // update the form data when the data changes
    handleChange(
      MODEL_CREATION_FORM_NAME.TRAINING_AREAS,
      // @ts-expect-error bad type definition
      trainingAreasData?.results.features,
    );
  }, [trainingAreasData]);

  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(formData.selectedTrainingDatasetId),
    offset: offset,
  });

  const fileUploadHandler = async (geometry: Geometry) => {
    snapGeoJSONGeometryToClosestTile(geometry);
    const wkt = geojsonToWKT(geometry as GeoJSONType);
    await createTrainingArea.mutateAsync({
      dataset: formData.selectedTrainingDatasetId,
      geom: `SRID=4326;${wkt}`,
    });
  };


  return (
    <>
      <FileUploadDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        label={"Upload Training Area(s)"}
        fileUploadHandler={fileUploadHandler}
        successToast={TOAST_NOTIFICATIONS.trainingAreasFileUploadSuccess}
        disabled={createTrainingArea.isPending}
      />
      <div className="h-screen flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <div className="basis-1/2">
            <StepHeading
              heading={MODEL_CREATION_CONTENT.trainingArea.pageTitle}
              description={MODEL_CREATION_CONTENT.trainingArea.pageDescription}
            />
          </div>
          <div className="flex flex-col items-end gap-y-4 ">
            <p className="flex items-center gap-x-2">
              <YouTubePlayIcon className="icon-lg" />
              {MODEL_CREATION_CONTENT.trainingArea.tutorialText}
            </p>
            <p className="text-dark">
              {MODEL_CREATION_CONTENT.trainingArea.datasetID}{" "}
              {formData.selectedTrainingDatasetId}
            </p>
          </div>
        </div>
        <div className="h-full w-full grid grid-cols-9  border-8 border-off-white">
          <div className="w-full col-span-6 2xl:col-span-7">
            <TrainingAreaMap
              tileJSONURL={tileJSONURL}
              data={trainingAreasData}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
              offset={offset}
            />
          </div>
          <div className="max-h-[80vh] flex col-span-3 2xl:col-span-2 flex-col w-full border-l-8 border-off-white gap-y-6 py-4">
            <OpenAerialMap tileJSONURL={tileJSONURL} />
            <TrainingAreaList
              offset={offset}
              setOffset={setOffset}
              isPlaceholderData={isPlaceholderData}
              data={trainingAreasData}
              isPending={trainingAreaIsPending}
              datasetId={Number(formData.selectedTrainingDatasetId)}
            />
            <div
              className={`flex mt-auto px-4  w-full ${trainingAreasData?.count === 0 ? "flex-col gap-y-6 " : "items-center justify-between gap-x-2 "}"`}
            >
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDrawingMode(DrawingModes.RECTANGLE);
                    showSuccessToast(TOAST_NOTIFICATIONS.drawingModeActivated);
                  }}
                >
                  <div className="flex items-center gap-x-2">
                    <p>{MODEL_CREATION_CONTENT.trainingArea.form.draw}</p>
                    <div className="w-4 h-4 border-2 rounded-md border-white"></div>
                  </div>
                </Button>
              </div>
              <ButtonWithIcon
                label={MODEL_CREATION_CONTENT.trainingArea.form.upload}
                variant="dark"
                suffixIcon={UploadIcon}
                onClick={toggle}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrainingAreaForm;
