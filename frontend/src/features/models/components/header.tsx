import { AddIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { ButtonWithIcon } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PageHeader = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL);
  };

  return (
    <div className="flex flex-col gap-y-8 my-12">
      <div>
        <h1 className="font-semibold text-title-1 text-primary md:text-large-title">
          {title ?? MODELS_CONTENT.models.modelsList.pageTitle}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-y-6 justify-between">
        <p className="max-w-[80%] md:max-w-[50%] text-gray text-body-2base md:text-body-2">
          {description ?? MODELS_CONTENT.models.modelsList.description}
        </p>
        <div className="self-start">
          <ButtonWithIcon
            onClick={handleClick}
            variant="primary"
            prefixIcon={AddIcon}
            label={MODELS_CONTENT.models.modelsList.ctaButton}
          />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
