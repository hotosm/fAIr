import { UploadIcon, YouTubePlayIcon } from "@/components/ui/icons";
import { StepHeading } from "@/features/model-creation/components/";
import TrainingAreaMap from "@/features/model-creation/components/training-area/training-area-map";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import {
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { useDialog } from "@/hooks/use-dialog";
import FileUploadDialog from "@/features/model-creation/components/dialogs/file-upload-dialog";
import { useEffect, useState } from "react";
import TrainingAreaList from "@/features/model-creation/components/training-area/training-area-list";
import { useGetTrainingAreas } from "@/features/model-creation/hooks/use-training-areas";
import OpenAerialMap from "@/features/model-creation/components/training-area/open-area-map";
import { useMap } from "@/app/providers/map-provider";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { MODEL_CREATION_CONTENT } from "@/utils";

const TrainingAreaForm = () => {
  const { formData } = useModelFormContext();
  const toast = useToastNotification();
  const tileJSONURL = formData.tmsURL.split("/{z}/{x}/{y}")[0];

  const { closeDialog, isOpened, toggle } = useDialog();
  const { handleChange } = useModelFormContext();
  const [offset, setOffset] = useState<number>(0);
  const { terraDraw } = useMap();
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
      trainingAreasData?.results,
    );
  }, [trainingAreasData]);

  return (
    <>
      <FileUploadDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        datasetId={formData.selectedTrainingDatasetId}
        offset={offset}
      />
      <div className="min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <div className="basis-1/2">
            <StepHeading
              heading={MODEL_CREATION_CONTENT.trainingArea.pageTitle}
              description={MODEL_CREATION_CONTENT.trainingArea.pageDescription}
            />
          </div>
          <div className="flex flex-col items-end gap-y-4 ">
            <p className="flex items-center gap-x-2">
              <YouTubePlayIcon className="icon-lg" />{MODEL_CREATION_CONTENT.trainingArea.tutorialText}
            </p>
            <p className="text-dark">
              {MODEL_CREATION_CONTENT.trainingArea.datasetID} {formData.selectedTrainingDatasetId}
            </p>
          </div>
        </div>
        <div className="flex-grow h-[90vh] w-full grid grid-cols-5 grid-rows-1 border-8 border-off-white">
          <div className="h-full  w-full col-span-4">
            <TrainingAreaMap
              tileJSONURL={tileJSONURL}
              data={trainingAreasData}
              trainingDatasetId={Number(formData.selectedTrainingDatasetId)}
              offset={offset}
            />
          </div>
          <div className="flex  flex-col w-full h-full border-l-8 border-off-white gap-y-6 py-4">
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
              className={`flex mt-auto px-4  ${trainingAreasData?.count === 0 ? "flex-col gap-y-6 " : " items-center justify-between gap-x-2 "} w-full"`}
            >
              <Button
                variant="primary"
                onClick={() => {
                  terraDraw?.setMode("rectangle");
                  toast(
                    "Draw mode activated. Hover on the map to start drawing.",
                    "success",
                  );
                }}
              >
                <div className="flex items-center gap-x-2">
                  <p>{MODEL_CREATION_CONTENT.trainingArea.form.draw}</p>
                  <div className="w-4 h-4 border-2 rounded-md border-white"></div>
                </div>
              </Button>
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
