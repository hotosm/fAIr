import { ButtonWithIcon } from "@/components/ui/button";
import { StepHeading } from "@/features/model-creation/components/";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import CreateNewTrainingDatasetForm from "./create-new";
import SelectExistingTrainingDatasetForm from "./select-existing";
import { TrainingDatasetOption } from "./enums";

const TrainingDatasetForm = ({
  setSelectedTrainingDatasetOption,
  selectedTrainingDatasetOption,
}: {
  selectedTrainingDatasetOption: TrainingDatasetOption;
  setSelectedTrainingDatasetOption: (option: TrainingDatasetOption) => void;
}) => {
  return (
    <div className="flex flex-col gap-y-20 w-full">
      <StepHeading
        heading="Training Dataset"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
      />
      {selectedTrainingDatasetOption === TrainingDatasetOption.NONE ? (
        <div className="flex flex-col gap-y-10 w-full">
          <ButtonWithIcon
            label="Create a New Training Dataset"
            suffixIcon={ChevronDownIcon}
            iconClassName="-rotate-90"
            variant={"dark"}
            capitalizeText={false}
            onClick={() =>
              setSelectedTrainingDatasetOption(TrainingDatasetOption.CREATE_NEW)
            }
          ></ButtonWithIcon>
          <ButtonWithIcon
            label="Select from Existing Training Dataset"
            suffixIcon={ChevronDownIcon}
            iconClassName="-rotate-90"
            capitalizeText={false}
            onClick={() =>
              setSelectedTrainingDatasetOption(
                TrainingDatasetOption.USE_EXISTING,
              )
            }
            variant={"default"}
          ></ButtonWithIcon>
        </div>
      ) : null}

      {/* Forms */}
      {selectedTrainingDatasetOption === TrainingDatasetOption.CREATE_NEW ? (
        <CreateNewTrainingDatasetForm />
      ) : null}

      {selectedTrainingDatasetOption === TrainingDatasetOption.USE_EXISTING ? (
        <SelectExistingTrainingDatasetForm />
      ) : null}
    </div>
  );
};

export default TrainingDatasetForm;
