import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { Input, TextArea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ButtonVariant, INPUT_TYPES } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { BASE_API_URL } from "@/config";
import { API_ENDPOINTS } from "@/services";
import { MapswipeProjectCreationSuccess } from "@/features/mapswipe/components/project-success-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { showErrorToast } from "@/utils";
import { formatProjectTopic } from "@/utils/mapswipe-utils";
import { useUpdateOfflinePrediction } from "@/features/user-profile/hooks/use-predictions";
import { useCreateMapSwipeProject } from "@/features/mapswipe/hooks/use-mapswipe-project";

const DESCRIPTION_MAX_LENGTH = 500;
const DESCRIPTION_MIN_LENGTH = 10;
const PROJECT_TOPIC_MAX_LENGTH = 255;
const PROJECT_TOPIC_MIN_LENGTH = 5;
const PROJECT_REGION_MAX_LENGTH = 255;
const PROJECT_REGION_MIN_LENGTH = 5;
const INSTRUCTIONS_MAX_LENGTH = 255;
const INSTRUCTIONS_MIN_LENGTH = 5;

export const CreateMapswipeProjectDialog = ({
  isOpened,
  closeDialog,
  predictionResult,
  openProjectStatus,
}: {
  isOpened: boolean;
  closeDialog: () => void;
  predictionResult: TOfflinePrediction;
  openProjectStatus: (prediction: TOfflinePrediction) => void;
}) => {
  const {
    isOpened: isSuccessDialogOpened,
    closeDialog: closeSuccessDialog,
    openDialog: openSuccessDialog,
  } = useDialog();
  const [localPrediction, setLocalPrediction] =
    useState<TOfflinePrediction>(predictionResult);

  const [loading, setLoading] = useState<boolean>(false);

  const { mutateAsync: MapSwipeProjectAsyncMutation } =
    useCreateMapSwipeProject({});

  // default values for the MapSwipe project creation form
  const DEFAULT_FORMDATA = {
    topic: "",
    region: "",
    description: "",
    instruction: "",
    geojson_url:
      BASE_API_URL +
      API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(localPrediction.id),
    tms_url: localPrediction.config.source,
    look_for: "buildings",
  };

  const [form, setForm] = useState(DEFAULT_FORMDATA);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Validation states for the form fields.
   */
  const [descriptionIsValid, setDescriptionIsValid] = useState({
    valid:
      form.description.length >= DESCRIPTION_MIN_LENGTH &&
      form.description.length <= DESCRIPTION_MAX_LENGTH,
    message: "",
  });

  const [instructionIsValid, setInstructionIsValid] = useState({
    valid:
      form.instruction.length >= INSTRUCTIONS_MIN_LENGTH &&
      form.instruction.length <= INSTRUCTIONS_MAX_LENGTH,
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
    // Reset the form to default values
    setForm(DEFAULT_FORMDATA);
    // Reset validation states
    setDescriptionIsValid({
      valid:
        form.description.length >= DESCRIPTION_MIN_LENGTH &&
        form.description.length <= DESCRIPTION_MAX_LENGTH,
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
    setInstructionIsValid({
      valid:
        form.instruction.length >= INSTRUCTIONS_MIN_LENGTH &&
        form.instruction.length <= INSTRUCTIONS_MAX_LENGTH,
      message: "",
    });
  };

  const { mutateAsync } = useUpdateOfflinePrediction({
    mutationConfig: {
      onSuccess: (data) => {
        handleCloseDialog();
        setLocalPrediction((prev) => ({
          ...prev,
          mapswipe_id: data.mapswipe_id,
        }));

        openSuccessDialog();
        setLoading(false);
      },
      onError: (error: any) => {
        showErrorToast(error);
      },
    },
  });

  const handleMapswipeProjectCreation = async () => {
    try {
      setLoading(true);
      const response = await MapSwipeProjectAsyncMutation({
        ...form,
        topic: formatProjectTopic(form.topic),
      });

      if (response.data.project_id) {
        mutateAsync({
          id: localPrediction.id,
          data: {
            mapswipe_id: response.data.project_id,
          },
        });
      } else {
        showErrorToast(
          "An error occurred while creating the MapSwipe project. Please try again.",
        );
      }
    } catch (error) {
      setLoading(false);
      showErrorToast(error);
    }
  };

  return (
    <>
      <MapswipeProjectCreationSuccess
        isOpen={isSuccessDialogOpened}
        onClose={closeSuccessDialog}
        handleMapswipeProjectDetailsOpen={() => {
          openProjectStatus(localPrediction);
          closeSuccessDialog();
        }}
      />
      <Dialog
        isOpened={isOpened}
        closeDialog={handleCloseDialog}
        label="Create MapSwipe Project"
        preventClose={loading}
      >
        <Divider />

        <div className="flex flex-col gap-2 mt-2">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Project Topic"
              required
              value={form.topic}
              handleInput={(e) => updateField("topic", e.target.value)}
              showBorder
              maxLength={PROJECT_TOPIC_MAX_LENGTH}
              labelWithTooltip
              toolTipContent="Starts with the project type title by MapSwipe convention (Conflate ..., Compare ..., etc)"
              placeholder="Validate Building Footprint"
              minLength={PROJECT_TOPIC_MIN_LENGTH}
              validationStateUpdateCallback={setTopicIsValid}
              isValid={form.topic.length > 0 && topicIsValid.valid}
            />
            <Input
              label="Project Region"
              value={form.region}
              required
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
            required
            label="Project Details"
            value={form.description}
            handleChange={(e) => updateField("description", e.target.value)}
            labelWithTooltip
            toolTipContent="More detailed description of the mapping project."
            maxLength={DESCRIPTION_MAX_LENGTH}
            helpText={descriptionIsValid.message}
            isValid={form.description.length > 0 && descriptionIsValid.valid}
            validationStateUpdateCallback={setDescriptionIsValid}
            minLength={DESCRIPTION_MIN_LENGTH}
            placeholder="This project is about validating building footprint in Banepa, Nepal. The goal is to improve the accuracy of building footprints."
          />

          <TextArea
            labelWithTooltip
            required
            label="Instruction"
            value={form.instruction}
            handleChange={(e) => updateField("instruction", e.target.value)}
            maxLength={INSTRUCTIONS_MAX_LENGTH}
            helpText={instructionIsValid.message}
            isValid={form.instruction.length > 0 && instructionIsValid.valid}
            validationStateUpdateCallback={setInstructionIsValid}
            minLength={INSTRUCTIONS_MIN_LENGTH}
            placeholder="Review each building footprint and verify it matches the satellite imagery. Mark as correct if the outline accurately traces the building structure."
            toolTipContent="Provide an intruction to guide the contributors on this project."
          />

          <div className="grid md:grid-cols-2 gap-2">
            <Input
              label="Group Size"
              value={25}
              handleInput={() => null}
              showBorder
              disabled
              type={INPUT_TYPES.NUMBER}
              labelWithTooltip
              toolTipContent="The number of tasks/features to validate/conflate in one group."
            />
            <Input
              label="Verification Number"
              type={INPUT_TYPES.NUMBER}
              disabled
              value={1}
              handleInput={() => null}
              showBorder
              toolTipContent="The number of answers from different users per task needed to consider the task completed."
              labelWithTooltip
            />

            <Input
              label="Tile Service URL"
              value={form.tms_url}
              handleInput={() => null}
              showBorder
              disabled
              labelWithTooltip
              toolTipContent="The URL to the tile service used in the project. The prediction result source is used by default."
            />

            <Input
              label="Input Geometries"
              value={form.geojson_url}
              handleInput={() => null}
              showBorder
              disabled
              labelWithTooltip
              toolTipContent="The URL to the input geometries file (GeoJSON) for the project. The prediction result file is used by default."
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
              onClick={handleMapswipeProjectCreation}
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
