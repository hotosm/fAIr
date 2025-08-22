import ConfettiExplosion from "react-confetti-explosion";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { ModelFormConfirmation } from "@/assets/images";
import { useModelsContext } from "@/app/providers/models-provider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { ButtonVariant } from "@/enums";

export const ModelConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelId = searchParams.get("id");
  const { isEditMode, resetState } = useModelsContext();

  // Reset the state on this page.
  useEffect(() => {
    if (!modelId) {
      navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL);
    }
    resetState();
  }, []);

  return (
    <div
      className={
        "col-span-12 flex flex-col gap-y-10 md:col-span-8 md:col-start-3"
      }
    >
      <div className="flex size-full flex-col items-center justify-center gap-y-10 text-center">
        <ConfettiExplosion
          force={0.2}
          duration={5000}
          particleCount={250}
          height={10000}
        />
        <Image src={ModelFormConfirmation} alt="Model Creation Success Icon" />
        <p className="text-title-2">
          Model {modelId} is {isEditMode ? "Updated" : "Created"}!
        </p>
        <p className="text-grey">
          {isEditMode
            ? MODELS_CONTENT.modelCreation.confirmation.updateDescription
            : MODELS_CONTENT.modelCreation.confirmation.description}
        </p>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Link
            href={`${APPLICATION_ROUTES.MODELS}/${modelId}`}
            title={MODELS_CONTENT.modelCreation.confirmation.buttons.goToModel}
            nativeAnchor={false}
          >
            <Button>
              {MODELS_CONTENT.modelCreation.confirmation.buttons.goToModel}
            </Button>
          </Link>
          <Link
            href={`${APPLICATION_ROUTES.MODELS}`}
            title={
              MODELS_CONTENT.modelCreation.confirmation.buttons.exploreModels
            }
          >
            <Button variant={ButtonVariant.DARK}>
              {MODELS_CONTENT.modelCreation.confirmation.buttons.exploreModels}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
