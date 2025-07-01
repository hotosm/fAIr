import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { Input, TextArea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ButtonVariant, INPUT_TYPES } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { BASE_API_URL, MATOMO_APP_DOMAIN } from "@/config";
import { APPLICATION_ROUTES } from "@/constants";
import { API_ENDPOINTS } from "@/services";
import { MapswipeProjectCreationuccess } from "./mapswipe-project-success-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { useFirebase } from "@/hooks/use-firebase";
import { showErrorToast } from "@/utils";

const DESCRIPTION_MAX_LENGTH = 500;
const DESCRIPTION_MIN_LENGTH = 10;
const PROJECT_TOPIC_MAX_LENGTH = 50;
const PROJECT_TOPIC_MIN_LENGTH = 5;
const PROJECT_REGION_MAX_LENGTH = 50;
const PROJECT_REGION_MIN_LENGTH = 5;

export const CreateMapswipeProjectDialog = ({
  isOpened,
  closeDialog,
  predictionResult,
}: {
  isOpened: boolean;
  closeDialog: () => void;
  predictionResult: TOfflinePrediction;
}) => {
  const {
    isOpened: isSuccessDialogOpened,
    closeDialog: closeSuccessDialog,
    openDialog: openSuccessDialog,
  } = useDialog();

  const { pushToDatabase } = useFirebase();
  const [loading, setLoading] = useState<boolean>(false);

  const DEFAULT_FORMDATA = {
    topic: "",
    region: "",
    details: "",
    organisation: "HOT",
    visibility: "Public",
    tutorial: "tutorial_-MQsj5VWpNcJxCTVTOyH",
    infoUrl:
      MATOMO_APP_DOMAIN +
      APPLICATION_ROUTES.MODELS +
      "/" +
      predictionResult.config.model_id,
    verification: "3",
    groupSize: 25,
    inputGeometryUrl:
      BASE_API_URL +
      API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(predictionResult.id),
    tileServiceUrl: predictionResult.config.source,
  };
  const [form, setForm] = useState(DEFAULT_FORMDATA);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [descriptionIsValid, setDescriptionIsValid] = useState({
    valid:
      form.details.length >= DESCRIPTION_MIN_LENGTH &&
      form.details.length <= DESCRIPTION_MAX_LENGTH,
    message: "",
  });

  const [topicIsValid, setTopicIsValid] = useState({
    valid:
      form.topic.length >= PROJECT_TOPIC_MIN_LENGTH &&
      form.topic.length <= PROJECT_TOPIC_MAX_LENGTH,
    message: "",
  });

  const [regionIsValid, setRegionIsValid] = useState({
    valid:
      form.region.length >= PROJECT_REGION_MIN_LENGTH &&
      form.region.length <= PROJECT_REGION_MAX_LENGTH,
    message: "",
  });

  const handleCloseDialog = () => {
    closeDialog();
    setLoading(false);
    setForm(DEFAULT_FORMDATA);
    setDescriptionIsValid({
      valid:
        form.details.length >= DESCRIPTION_MIN_LENGTH &&
        form.details.length <= DESCRIPTION_MAX_LENGTH,
      message: "",
    });
    setTopicIsValid({
      valid:
        form.topic.length >= PROJECT_TOPIC_MIN_LENGTH &&
        form.topic.length <= PROJECT_TOPIC_MAX_LENGTH,
      message: "",
    });
    setRegionIsValid({
      valid:
        form.region.length >= PROJECT_REGION_MIN_LENGTH &&
        form.region.length <= PROJECT_REGION_MAX_LENGTH,
      message: "",
    });
  };

  const handleProjectCreation = async () => {
    try {
      setLoading(true);
      const newProjectDraftsRef = await pushToDatabase();
      if (newProjectDraftsRef.key) {
        handleCloseDialog();
        openSuccessDialog();
        // send actual project data to the database here
        // patch this prediction result with the mapswipe project id
      } else {
        showErrorToast("Failed to create MapSwipe project.");
      }
    } catch (error) {
      setLoading(false);
      showErrorToast(error);
    }
  };

  return (
    <>
      <MapswipeProjectCreationuccess
        isOpen={isSuccessDialogOpened}
        onClose={closeSuccessDialog}
        handleMapswipeProjectOpen={closeSuccessDialog}
      />
      <Dialog
        isOpened={isOpened}
        closeDialog={handleCloseDialog}
        label="Create MapSwipe Project"
        preventClose={loading}
      >
        <Divider />

        <div className="flex flex-col gap-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Project Topic"
              value={form.topic}
              handleInput={(e) => updateField("topic", e.target.value)}
              showBorder
              maxLength={PROJECT_TOPIC_MAX_LENGTH}
              labelWithTooltip
              toolTipContent="Starts with the project type title by MapSwipe convention (Conflate ..., Compare ..., etc)"
              placeholder="Conflate fAIr buildings"
              minLength={PROJECT_TOPIC_MIN_LENGTH}
              validationStateUpdateCallback={setTopicIsValid}
              isValid={form.topic.length > 0 && topicIsValid.valid}
            />
            <Input
              label="Project Region"
              value={form.region}
              handleInput={(e) => updateField("region", e.target.value)}
              showBorder
              maxLength={PROJECT_REGION_MAX_LENGTH}
              labelWithTooltip
              toolTipContent="The region where the project is located, e.g., Banepa, Nepal"
              placeholder="Banepa, Nepal"
              minLength={PROJECT_REGION_MIN_LENGTH}
              validationStateUpdateCallback={setRegionIsValid}
              isValid={form.region.length > 0 && regionIsValid.valid}
            />
          </div>

          <TextArea
            label="Project Details"
            value={form.details}
            handleChange={(e) => updateField("details", e.target.value)}
            labelWithTooltip
            toolTipContent="More detailed description of the mapping project."
            maxLength={DESCRIPTION_MAX_LENGTH}
            helpText={descriptionIsValid.message}
            isValid={form.details.length > 0 && descriptionIsValid.valid}
            validationStateUpdateCallback={setDescriptionIsValid}
            minLength={DESCRIPTION_MIN_LENGTH}
            placeholder="This project is about conflating buildings in Banepa, Nepal. The goal is to improve the accuracy of building footprints."
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Group Size"
              value={form.groupSize}
              handleInput={(e) => updateField("groupSize", e.target.value)}
              showBorder
              max={250}
              min={10}
              type={INPUT_TYPES.NUMBER}
              labelWithTooltip
              toolTipContent="The number of tasks/features to validate/conflate in one group."
            />
            <Input
              label="Verification Number"
              value={form.verification}
              type={INPUT_TYPES.NUMBER}
              min={1}
              max={10}
              handleInput={(e) => updateField("verification", e.target.value)}
              showBorder
              toolTipContent="The number of answers from different users per task needed to consider the task completed."
              labelWithTooltip
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Additional information resource (URL)"
              value={form.infoUrl}
              handleInput={(e) => updateField("infoUrl", e.target.value)}
              showBorder
              disabled
            />
            <Input
              label="Visibility"
              value={form.visibility}
              handleInput={(e) => updateField("visibility", e.target.value)}
              showBorder
              disabled
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Tutorial"
              value={form.tutorial}
              handleInput={(e) => updateField("tutorial", e.target.value)}
              showBorder
              disabled
            />
            <Input
              label="Input Geometries File (Direct Link)"
              value={form.inputGeometryUrl}
              handleInput={(e) =>
                updateField("inputGeometryUrl", e.target.value)
              }
              showBorder
              disabled
            />
            <Input
              label="Requesting Organisation"
              value={form.organisation}
              handleInput={(e) => updateField("organisation", e.target.value)}
              showBorder
              disabled
            />
            <Input
              label="Tile Service URL"
              value={form.tileServiceUrl}
              handleInput={(e) => updateField("tileServiceUrl", e.target.value)}
              showBorder
              disabled
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-6 mt-4">
            <Button
              variant={ButtonVariant.DARK}
              onClick={handleCloseDialog}
              className="md:!w-fit"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant={ButtonVariant.PRIMARY}
              onClick={handleProjectCreation}
              className="md:!w-fit"
              disabled={
                loading ||
                !(
                  topicIsValid.valid &&
                  regionIsValid.valid &&
                  descriptionIsValid.valid
                )
              }
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </Dialog>{" "}
    </>
  );
};
