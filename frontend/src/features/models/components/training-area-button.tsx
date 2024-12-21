import { ChevronDownIcon } from "@/components/ui/icons";
import { APP_CONTENT } from "@/utils";

export const TrainingAreaButton = ({
  disabled,
  onClick,
}: {
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      className="md:self-end flex items-center gap-x-2 cursor-pointer text-primary text-body-3 md:text-body-2 md:font-semibold"
      onClick={onClick}
    >
      <p>{APP_CONTENT.models.modelsDetailsCard.viewTrainingArea}</p>
      <ChevronDownIcon className="icon -rotate-90" />
    </button>
  );
};
