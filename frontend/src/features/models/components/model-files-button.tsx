import { ButtonWithIcon } from "@/components/ui/button";
import { DirectoryIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { APP_CONTENT } from "@/utils";

const ModelFilesButton = ({
  openModelFilesDialog,
  disabled,
}: {
  disabled: boolean;
  openModelFilesDialog: () => void;
}) => {
  return (
    <ButtonWithIcon
      label={APP_CONTENT.models.modelsDetailsCard.modelFiles}
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
