import { ButtonWithIcon } from "@/components/ui/button";
import { AddIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES } from "@/utils";
import { useNavigate } from "react-router-dom";

const PageHeader = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-y-8 my-12">
      <div>
        <h1 className="font-semibold text-title-1 text-primary md:text-large-title">
          fAIr AI models
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-y-6 justify-between">
        <p className="max-w-[80%] md:max-w-[50%] text-gray text-body-2base md:text-body-2">
          Each model is trained using one of the training datasets. Published
          models can be used to find mappable features in imagery that is
          similar to the training areas that dataset comes from.
        </p>
        <div className="self-start">
          <ButtonWithIcon
            variant="primary"
            prefixIcon={AddIcon}
            label="Create Model"
            onClick={() => navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL)}
          />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
