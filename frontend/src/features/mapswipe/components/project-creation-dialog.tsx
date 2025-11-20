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
import { MapswipeProjectCreationSuccess } from "./project-success-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { showErrorToast } from "@/utils";
import { formatProjectTopic } from "@/utils/mapswipe-utils";
import { useUpdateOfflinePrediction } from "@/features/user-profile/hooks/use-predictions";

const DESCRIPTION_MAX_LENGTH = 500;
const DESCRIPTION_MIN_LENGTH = 10;
const PROJECT_TOPIC_MAX_LENGTH = 50;
const PROJECT_TOPIC_MIN_LENGTH = 5;
const PROJECT_REGION_MAX_LENGTH = 50;
const PROJECT_REGION_MIN_LENGTH = 5;
const TILE_SERVICE_CREDITS_MAX_LENGTH = 100;
const TILE_SERVICE_CREDITS_MIN_LENGTH = 5;

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

  
  const [loading, setLoading] = useState<boolean>(false);

  // default values for the MapSwipe project creation form
  const DEFAULT_FORMDATA = {
    projectTopic: "",
    projectRegion: "",
    projectDetails: "",
    requestingOrganisation: "HOT",
    tutorialId: "tutorial_-MQsj5VWpNcJxCTVTOyH",
    manualUrl:
      MATOMO_APP_DOMAIN +
      APPLICATION_ROUTES.MODELS +
      "/" +
      predictionResult.config.model_id,
    verificationNumber: "3",
    groupSize: 25,
    inputGeometryUrl: {
      geometry:
        BASE_API_URL +
        API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(predictionResult.id),
      inputType: "link",
    },
    tileServiceURL: predictionResult.config.source,
    tileServiceCredits: "OpenStreetMap contributors",
    projectType: 8, // 8 is the project type for conflation
    createdBy: "atCSosZACaN0qhcVjtMO1tq9d1G3",
    image:
      "https://firebasestorage.googleapis.com/v0/b/dev-mapswipe.appspot.com/o/projectImages%2F1742895229710-project-image-1x1.png?alt=media&token=26cf1956-9ab7-4348-b529-9952f2f8424e",
    lookFor: "Buildings",
    // The project number is the prediction result ID, which is used to link the project to the prediction result
    projectNumber: predictionResult.id,
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
      form.projectDetails.length >= DESCRIPTION_MIN_LENGTH &&
      form.projectDetails.length <= DESCRIPTION_MAX_LENGTH,
    message: "",
  });

  const [tileServiceCreditsIsValid, setTileServiceCreditsIsValid] = useState({
    valid:
      form.tileServiceCredits.length >= TILE_SERVICE_CREDITS_MIN_LENGTH &&
      form.tileServiceCredits.length <= TILE_SERVICE_CREDITS_MAX_LENGTH,
    message: "",
  });

  const [topicIsValid, setTopicIsValid] = useState({
    valid:
      form.projectTopic.length >= PROJECT_TOPIC_MIN_LENGTH &&
      form.projectTopic.length <= PROJECT_TOPIC_MAX_LENGTH,
    message: "",
  });

  const [regionIsValid, setRegionIsValid] = useState({
    valid:
      form.projectRegion.length >= PROJECT_REGION_MIN_LENGTH &&
      form.projectRegion.length <= PROJECT_REGION_MAX_LENGTH,
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
        form.projectDetails.length >= DESCRIPTION_MIN_LENGTH &&
        form.projectDetails.length <= DESCRIPTION_MAX_LENGTH,
      message: "",
    });
    setTopicIsValid({
      valid:
        form.projectTopic.length >= PROJECT_TOPIC_MIN_LENGTH &&
        form.projectTopic.length <= PROJECT_TOPIC_MAX_LENGTH,
      message: "",
    });
    setRegionIsValid({
      valid:
        form.projectRegion.length >= PROJECT_REGION_MIN_LENGTH &&
        form.projectRegion.length <= PROJECT_REGION_MAX_LENGTH,
      message: "",
    });
    setTileServiceCreditsIsValid({
      valid:
        form.tileServiceCredits.length >= TILE_SERVICE_CREDITS_MIN_LENGTH &&
        form.tileServiceCredits.length <= TILE_SERVICE_CREDITS_MAX_LENGTH,
      message: "",
    });
  };

  const { mutateAsync } = useUpdateOfflinePrediction({
    mutationConfig: {
      onSuccess: () => {
        handleCloseDialog();
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

      // The name of the project is a combination of the project topic, region, number, and requesting organisation.
      // This is used to create a unique name for the project.
      const name = `${form.projectTopic} - ${form.projectRegion} - ${form.projectNumber} - ${form.requestingOrganisation}`;

      const projectTopickey = formatProjectTopic(form.projectTopic);

      // Create a new project draft in the database
      // This is a temporary draft that will be used to create the final project
      
      
       

        const data = {
          ...form,
          name,
          projectTopicKey: projectTopickey,
          tileServer: {
            url: predictionResult.config.source,
            credits: form.tileServiceCredits,
            name: "custom",
            wmtsLayerName: "-",
          },
        };

        // Update the database with the new project data
       
      //   await mutateAsync({
      //     id: predictionResult.id,
      //     data: {
      //       mapswipe_id: newProjectDraftsRef.key,
      //     },
      //   });
      // } else {
      //   showErrorToast("Failed to create MapSwipe project.");
      // }
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
              value={form.projectTopic}
              handleInput={(e) => updateField("projectTopic", e.target.value)}
              showBorder
              maxLength={PROJECT_TOPIC_MAX_LENGTH}
              labelWithTooltip
              toolTipContent="Starts with the project type title by MapSwipe convention (Conflate ..., Compare ..., etc)"
              placeholder="Conflate fAIr buildings"
              minLength={PROJECT_TOPIC_MIN_LENGTH}
              validationStateUpdateCallback={setTopicIsValid}
              isValid={form.projectTopic.length > 0 && topicIsValid.valid}
            />
            <Input
              label="Project Region"
              value={form.projectRegion}
              handleInput={(e) => updateField("projectRegion", e.target.value)}
              showBorder
              maxLength={PROJECT_REGION_MAX_LENGTH}
              labelWithTooltip
              toolTipContent="The region where the project is located, e.g., Banepa, Nepal"
              placeholder="Banepa, Nepal"
              minLength={PROJECT_REGION_MIN_LENGTH}
              validationStateUpdateCallback={setRegionIsValid}
              isValid={form.projectRegion.length > 0 && regionIsValid.valid}
            />
          </div>

          <TextArea
            label="Project Details"
            value={form.projectDetails}
            handleChange={(e) => updateField("projectDetails", e.target.value)}
            labelWithTooltip
            toolTipContent="More detailed description of the mapping project."
            maxLength={DESCRIPTION_MAX_LENGTH}
            helpText={descriptionIsValid.message}
            isValid={form.projectDetails.length > 0 && descriptionIsValid.valid}
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
              value={form.verificationNumber}
              type={INPUT_TYPES.NUMBER}
              min={1}
              max={10}
              handleInput={(e) =>
                updateField("verificationNumber", e.target.value)
              }
              showBorder
              toolTipContent="The number of answers from different users per task needed to consider the task completed."
              labelWithTooltip
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Tile Service Credits"
              value={form.tileServiceCredits}
              handleInput={(e) =>
                updateField("tileServiceCredits", e.target.value)
              }
              maxLength={TILE_SERVICE_CREDITS_MAX_LENGTH}
              helpText={tileServiceCreditsIsValid.message}
              isValid={
                form.tileServiceCredits.length > 0 &&
                tileServiceCreditsIsValid.valid
              }
              validationStateUpdateCallback={setTileServiceCreditsIsValid}
              minLength={TILE_SERVICE_CREDITS_MIN_LENGTH}
              showBorder
              labelWithTooltip
              placeholder="e.g., © OpenStreetMap contributors"
              toolTipContent="The attribution for the tile service used in the project. This is usually the name of the tile service provider."
            />{" "}
            <Input
              label="Tile Service URL"
              value={form.tileServiceURL}
              handleInput={() => null}
              showBorder
              disabled
              labelWithTooltip
              toolTipContent="The URL to the tile service used in the project. The prediction result source is used by default."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Additional information URL"
              value={form.manualUrl}
              handleInput={() => null}
              labelWithTooltip
              toolTipContent="A link to a manual or additional information resource for the project. The model details page is used by default."
              showBorder
              disabled
            />
            <Input
              label="Input Geometries"
              value={form.inputGeometryUrl.geometry}
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