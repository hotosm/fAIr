import { ChevronDownIcon } from '@/components/ui/icons';
import { MODELS_CONTENT } from '@/constants';

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
      <p>{MODELS_CONTENT.models.modelsDetailsCard.viewTrainingArea}</p>
      <ChevronDownIcon className="icon -rotate-90" />
    </button>
  );
};
