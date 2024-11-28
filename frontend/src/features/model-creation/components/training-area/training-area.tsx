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
  extractTileJSONURL,
  MODEL_CREATION_CONTENT,
  showSuccessToast,
  snapGeoJSONGeometryToClosestTile,
} from "@/utils";
import { TOAST_NOTIFICATIONS } from "@/contents";
import { DrawingModes, SHOELACE_SIZES } from "@/enums";
import { GeoJSONType, Geometry } from "@/types";
import { geojsonToWKT } from "@terraformer/wkt";
import { FullSreenWidthComponent } from "@/components/ui/full-screen";
import useScreenSize from "@/hooks/use-screen-size";

const TrainingAreaForm = () => {
  const { formData } = useModelsContext();

  const tileJSONURL = extractTileJSONURL(formData.tmsURL);

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
      <div className="min-h-screen flex flex-col mb-10">
        <div className="flex md:justify-between md:items-center flex-col md:flex-row gap-y-4 mb-10">
          <div className="basis-2/3">
            <StepHeading
              heading={MODEL_CREATION_CONTENT.trainingArea.pageTitle}
              description={MODEL_CREATION_CONTENT.trainingArea.pageDescription}
            />
          </div>
          <div className="flex flex-col md:items-end gap-y-4 ">
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
        <FullSreenWidthComponent>
          <div className="border-t-8 border-x-8 border-off-white mb-10 md:hidden">
            <OpenAerialMap tileJSONURL={tileJSONURL} />
          </div>
        </FullSreenWidthComponent>

        <FullSreenWidthComponent>
          <div className="h-full w-full grid grid-cols-12 md:grid-cols-9  border-8 border-off-white">
            <div className="w-full h-[70vh] md:h-full col-span-12 md:col-span-6 2xl:col-span-7">
              <TrainingAreaMap
                tileJSONURL={tileJSONURL}
                data={trainingAreasData}
                trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
                offset={offset}
              />
            </div>
            <div className="hidden md:flex h-[90vh]  col-span-12 md:col-span-3 2xl:col-span-2 flex-col w-full border-l-8 border-off-white gap-y-6 py-4 ">
              <OpenAerialMap tileJSONURL={tileJSONURL} />
              <TrainingAreaList
                offset={offset}
                setOffset={setOffset}
                isPlaceholderData={isPlaceholderData}
                data={trainingAreasData}
                isPending={trainingAreaIsPending}
                datasetId={Number(formData.selectedTrainingDatasetId)}
              />
              <ActionButtons
                toggle={toggle}
                trainingAreasDataCount={trainingAreasData?.count}
                setDrawingMode={setDrawingMode}
              />
            </div>
          </div>
        </FullSreenWidthComponent>
        <FullSreenWidthComponent>
          <div className="md:hidden h-[60vh] overflow-y-auto border-8 border-b-0 border-off-white mb-10 py-2">
            <TrainingAreaList
              offset={offset}
              setOffset={setOffset}
              isPlaceholderData={isPlaceholderData}
              data={trainingAreasData}
              isPending={trainingAreaIsPending}
              datasetId={Number(formData.selectedTrainingDatasetId)}
            />
          </div>
          <div className="md:hidden">
            <ActionButtons
              toggle={toggle}
              trainingAreasDataCount={trainingAreasData?.count}
              setDrawingMode={setDrawingMode}
            />
          </div>
        </FullSreenWidthComponent>
      </div>
    </>
  );
};

export default TrainingAreaForm;

const ActionButtons = ({
  trainingAreasDataCount,
  setDrawingMode,
  toggle,
}: {
  trainingAreasDataCount?: number;
  setDrawingMode: (mode: DrawingModes) => void;
  toggle: () => void;
}) => {
  const { isMobile } = useScreenSize();
  return (
    <div
      className={`flex  mt-auto px-4 md:px-1 lg:px-4  w-full ${trainingAreasDataCount === 0 ? "flex-col gap-y-6 " : "items-center justify-between md:justify-center lg:justify-between gap-x-1 md:gap-x-2 "}"`}
    >
      <div>
        <Button
          variant="primary"
          size={isMobile ? SHOELACE_SIZES.SMALL : SHOELACE_SIZES.MEDIUM}
          onClick={() => {
            setDrawingMode(DrawingModes.RECTANGLE);
            showSuccessToast(TOAST_NOTIFICATIONS.drawingModeActivated);
          }}
        >
          <div className="flex items-center gap-x-1 md:gap-x-2">
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
        size={isMobile ? SHOELACE_SIZES.SMALL : SHOELACE_SIZES.MEDIUM}
      />
    </div>
  );
};
