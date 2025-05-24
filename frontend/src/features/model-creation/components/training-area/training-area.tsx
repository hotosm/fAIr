import FileUploadDialog from "@/features/model-creation/components/dialogs/file-upload-dialog";
import OpenAerialMap from "@/features/model-creation/components/training-area/open-area-map";
import TrainingAreaList from "@/features/model-creation/components/training-area/training-area-list";
import TrainingAreaMap from "@/features/model-creation/components/training-area/training-area-map";
import useScreenSize from "@/hooks/use-screen-size";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { ButtonVariant, DrawingModes, SHOELACE_SIZES } from "@/enums";
import { geojsonToWKT } from "@terraformer/wkt";
import { MODELS_CONTENT, TOAST_NOTIFICATIONS } from "@/constants";
import { Polygon } from "geojson";
import { StepHeading } from "@/features/model-creation/components/";
import { UploadIcon, YouTubePlayIcon } from "@/components/ui/icons";
import { useDialog } from "@/hooks/use-dialog";
import { useEffect, useRef, useState } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";
import {
  useCreateTrainingArea,
  useGetTrainingAreas,
} from "@/features/model-creation/hooks/use-training-areas";
import {
  extractTileJSONURL,
  showSuccessToast,
  snapGeoJSONPolygonToClosestTile,
} from "@/utils";
import { useGetTMSTileJSON } from "@/features/model-creation/hooks/use-tms-tilejson";
import { TileJSON } from "@/types";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { useAppTour } from "@/app/providers/tour-provider";
import { TrainingLabelsOffset } from "@/features/model-creation/components/training-area/training-labels-offset";

const TrainingAreaForm = () => {
  const { formData, handleChange } = useModelsContext();
  const { map, mapContainerRef, drawingMode, setDrawingMode, terraDraw } =
    useMapInstance();

  const tileJSONURL = extractTileJSONURL(formData.tmsURL);
  const initialOffset = {
    x: formData.datasetOffset?.[0] || 0,
    y: formData.datasetOffset?.[1] || 0,
  };
  const [trainingDatasetOffset, setTrainingDatasetOffset] =
    useState(initialOffset);

  const { closeDialog, isOpened, toggle } = useDialog();

  const [offset, setOffset] = useState<number>(0);
  const { startTrainingAreaTour } = useAppTour();
  const {
    data: trainingAreasData,
    isPending: trainingAreaIsPending,
    isPlaceholderData,
  } = useGetTrainingAreas(Number(formData.selectedTrainingDatasetId), offset);

  const { isPending, data, isError } = useGetTMSTileJSON(
    tileJSONURL,
    !!formData.selectedTrainingDatasetId,
  );

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

  const fileUploadHandler = async (polygonGeometry: Polygon) => {
    snapGeoJSONPolygonToClosestTile(polygonGeometry);
    const wkt = geojsonToWKT(polygonGeometry);
    await createTrainingArea.mutateAsync({
      dataset: formData.selectedTrainingDatasetId,
      geom: `SRID=4326;${wkt}`,
    });
  };

  const mapElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapElementRef.current) {
      mapElementRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mapElementRef.current]);
  const handleOffsetReset = () => {
    setTrainingDatasetOffset(initialOffset);
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
      <div className="lg:h-screen min-h-screen flex flex-col mb-40">
        <div className="flex md:justify-between md:items-center flex-col md:flex-row gap-y-4 mb-10">
          <div className="basis-2/3">
            <StepHeading
              heading={MODELS_CONTENT.modelCreation.trainingArea.pageTitle}
              description={
                MODELS_CONTENT.modelCreation.trainingArea.pageDescription
              }
            />
          </div>
          <div className="flex flex-col md:items-end gap-y-4 ">
            <button
              className="flex items-center gap-x-2"
              onClick={startTrainingAreaTour}
              id={APP_TOUR_IDS.TUTORIAL_BUTTON}
            >
              <YouTubePlayIcon className="icon-lg" />
              {MODELS_CONTENT.modelCreation.trainingArea.tutorialText}
            </button>
            <p className="text-dark">
              {MODELS_CONTENT.modelCreation.trainingArea.datasetID}{" "}
              <span className="font-semibold">
                {formData.selectedTrainingDatasetId}
              </span>
            </p>
          </div>
        </div>

        <div className="fullscreen md:no-fullscreen lg:hidden ">
          <div className="border-t border-gray-border">
            <OpenAerialMap
              map={map}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
              OAMIsPending={isPending}
              OAMIsError={isError}
              OAMData={data as TileJSON}
            />
          </div>

          <div className="border-t border-gray-border min-h-24">
            <TrainingLabelsOffset
              trainingDatasetOffset={trainingDatasetOffset}
              setTrainingDatasetOffset={setTrainingDatasetOffset}
              handleOffsetReset={handleOffsetReset}
              initialOffset={initialOffset}
            />
          </div>
        </div>

        <div
          ref={mapElementRef}
          className="h-full grid grid-cols-12 lg:grid-cols-9 fullscreen md:no-fullscreen bg-off-white pl-2 py-2"
        >
          <div className="w-full h-[90vh] col-span-12 lg:col-span-6 2xl:col-span-7 pr-2 lg:pr-0">
            <TrainingAreaMap
              tileJSONURL={tileJSONURL}
              data={trainingAreasData}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
              offset={offset}
              map={map}
              mapContainerRef={mapContainerRef}
              terraDraw={terraDraw}
              setDrawingMode={setDrawingMode}
              drawingMode={drawingMode}
              trainingAreaIsPending={trainingAreaIsPending}
              OAMData={data as TileJSON}
              trainingDatasetOffset={trainingDatasetOffset}
            />
          </div>
          {/* web */}
          <div className="hidden lg:flex h-[90vh] max-h-screen col-span-12 lg:col-span-3 2xl:col-span-2 flex-col w-full px-2 gap-y-2">
            <OpenAerialMap
              map={map}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
              OAMIsPending={isPending}
              OAMIsError={isError}
              OAMData={data as TileJSON}
            />
            <TrainingLabelsOffset
              trainingDatasetOffset={trainingDatasetOffset}
              setTrainingDatasetOffset={setTrainingDatasetOffset}
              handleOffsetReset={handleOffsetReset}
              initialOffset={initialOffset}
            />
            <div className="bg-white flex-1 flex flex-col p-2 rounded-lg min-h-0">
              <TrainingAreaList
                offset={offset}
                setOffset={setOffset}
                isPlaceholderData={isPlaceholderData}
                data={trainingAreasData}
                isPending={trainingAreaIsPending}
                datasetId={Number(formData.selectedTrainingDatasetId)}
                map={map}
              />
              <ActionButtons
                toggle={toggle}
                trainingAreasDataCount={trainingAreasData?.count}
                setDrawingMode={setDrawingMode}
              />
            </div>
          </div>
        </div>
        {/* Mobile  */}
        <div className="flex flex-col lg:hidden h-[90vh] max-h-screen fullscreen sm:no-fullscreen py-2">
          <TrainingAreaList
            offset={offset}
            setOffset={setOffset}
            isPlaceholderData={isPlaceholderData}
            data={trainingAreasData}
            isPending={trainingAreaIsPending}
            datasetId={Number(formData.selectedTrainingDatasetId)}
            map={map}
          />

          <ActionButtons
            toggle={toggle}
            trainingAreasDataCount={trainingAreasData?.count}
            setDrawingMode={setDrawingMode}
          />
        </div>
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
  const { isTablet } = useScreenSize();
  return (
    <div
      className={`flex gap-y-2 mt-auto mb-2 px-4 md:px-1 lg:px-4  w-full ${trainingAreasDataCount === 0 ? "flex-col w-full" : "items-center justify-between gap-x-1 md:gap-x-2 "}"`}
    >
      <div className="w-full" id={APP_TOUR_IDS.DRAW_TRAINING_AREA}>
        <Button
          size={isTablet ? SHOELACE_SIZES.SMALL : SHOELACE_SIZES.MEDIUM}
          onClick={() => {
            setDrawingMode(DrawingModes.RECTANGLE);
            showSuccessToast(TOAST_NOTIFICATIONS.drawingModeActivated);
          }}
        >
          <div className="flex items-center gap-x-1 md:gap-x-2">
            <p>{MODELS_CONTENT.modelCreation.trainingArea.form.draw}</p>
            <div className="w-4 h-4 border-2 rounded-md border-white"></div>
          </div>
        </Button>
      </div>
      <div className="w-full">
        <ButtonWithIcon
          size={isTablet ? SHOELACE_SIZES.SMALL : SHOELACE_SIZES.MEDIUM}
          label={MODELS_CONTENT.modelCreation.trainingArea.form.upload}
          variant={ButtonVariant.DARK}
          suffixIcon={UploadIcon}
          onClick={toggle}
        />
      </div>
    </div>
  );
};
