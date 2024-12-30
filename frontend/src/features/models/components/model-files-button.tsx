import { ButtonWithIcon } from '@/components/ui/button';
import { DirectoryIcon } from '@/components/ui/icons';
import { MODELS_CONTENT } from '@/constants';
import { SHOELACE_SIZES } from '@/enums';

const ModelFilesButton = ({
  openModelFilesDialog,
  disabled,
}: {
  disabled: boolean;
  openModelFilesDialog: () => void;
}) => {
  return (
    <ButtonWithIcon
      label={MODELS_CONTENT.models.modelsDetailsCard.modelFiles}
      className="border-dark border"
      variant={"none"}
      onClick={openModelFilesDialog}
      prefixIcon={DirectoryIcon}
      disabled={disabled}
      size={SHOELACE_SIZES.SMALL}
    />
  );
};

export default ModelFilesButton;
