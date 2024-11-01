import {
  FullScreenIcon,
  UploadIcon,
  YouTubePlayIcon,
} from "@/components/ui/icons";
import { StepHeading } from "@/features/model-creation/components/";
import TrainingAreaMap from "./training-area-map";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import {
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { useGetTMSTileJSON } from "../../hooks/use-tms-tilejson";
import { useDialog } from "@/hooks/use-dialog";
import FileUploadDialog from "../dialogs/file-upload-dialog";
import { useEffect, useState } from "react";
import TrainingAreaList from "./training-area-list";
import { useGetTrainingAreas } from "../../hooks/use-training-areas";
import { useMap } from "@/app/providers/map-provider";

const TrainingAreaForm = () => {
  const { formData } = useModelFormContext();

  const tileJSONURL = formData.tmsURL.split("/{z}/{x}/{y}")[0];

  const { isPending, data, isError } = useGetTMSTileJSON(tileJSONURL);

  const { closeDialog, isOpened, toggle } = useDialog();
  const { handleChange } = useModelFormContext();

  const { map } = useMap();

  const fitToTMSBounds = () => {
    // @ts-expect-error bad type definition
    map?.fitBounds(data?.bounds);
  };

  const [offset, setOffset] = useState<number>(0);
  const {
    data: trainingAreasData,
    isPending: trainingAreaIsPending,
    isPlaceholderData,
  } = useGetTrainingAreas(Number(formData.selectedTrainingDatasetId), offset);

  useEffect(() => {
    if (!trainingAreasData) return;
    // update the form data when the data changes
    // @ts-expect-error bad type definition
    handleChange(
      MODEL_CREATION_FORM_NAME.TRAINING_AREAS,
      trainingAreasData?.results,
    );
  }, [trainingAreasData]);

  return (
    <>
      <FileUploadDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        datasetId={formData.selectedTrainingDatasetId}
      />
      <div className="flex flex-col h-screen max-h-screen ">
        <div className="flex justify-between items-center mb-10">
          <div className="basis-1/2">
            <StepHeading
              heading="Create Training Area"
              description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
            />
          </div>
          <div className="flex flex-col items-end gap-y-4 ">
            <p className="flex items-center gap-x-2">
              <YouTubePlayIcon className="icon-lg" /> Tutorial
            </p>
            <p className="text-dark">
              Dataset ID: {formData.selectedTrainingDatasetId}
            </p>
          </div>
        </div>
        <div className="flex-grow max-h-[80vh] w-full grid grid-cols-5 grid-rows-1 border-8 border-off-white">
          <div className="h-full w-full col-span-4">
            <TrainingAreaMap
              tileJSONURL={tileJSONURL}
              data={trainingAreasData}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
            />
          </div>
          <div className="flex  flex-col w-full h-full border-l-8 border-off-white gap-y-6 py-4">
            <div className="flex  flex-col  gap-y-2 w-full border-b-8 border-off-white px-4 pb-4">
              <p className="text-body-1">Open Aerial Map</p>
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-col gap-y-2">
                  <p className="text-body-3">{formData.datasetName}</p>
                  <div className="flex items-center justify-between w-full gap-x-4">
                    <p className="text-body-4">
                      Max zoom: {data?.maxzoom ?? 0}
                    </p>
                    <p className="text-body-4">
                      Min zoom: {data?.minzoom ?? 0}
                    </p>
                  </div>
                </div>
                <button
                  className="bg-off-white p-2 rounded-md"
                  disabled={!map || isPending || isError}
                  onClick={fitToTMSBounds}
                >
                  <FullScreenIcon className="icon-lg" />
                </button>
              </div>
            </div>
            <TrainingAreaList
              offset={offset}
              setOffset={setOffset}
              isPlaceholderData={isPlaceholderData}
              data={trainingAreasData}
              isPending={trainingAreaIsPending}
              datasetId={Number(formData.selectedTrainingDatasetId)}
            />
            <div
              className={`flex mt-auto px-4  ${trainingAreasData?.count === 0 ? "flex-col gap-y-6 " : " items-center justify-between gap-x-2 "} w-full"`}
            >
              <Button variant="primary">
                <div className="flex items-center gap-x-2">
                  <p>Draw</p>
                  <div className="w-4 h-4 border-2 rounded-md border-white"></div>
                </div>
              </Button>
              <ButtonWithIcon
                label="upload"
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
