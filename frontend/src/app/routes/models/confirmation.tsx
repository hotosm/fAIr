import ConfettiExplosion from "react-confetti-explosion";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { ModelFormConfirmation } from "@/assets/images";
import { useModelsContext } from "@/app/providers/models-provider";
import { useSearchParams } from "react-router-dom";

export const ModelConfirmationPage = () => {
  const [searchParams] = useSearchParams();

  const modelId = searchParams.get("id");
  const { isEditMode } = useModelsContext();

  return (
    <div
      className={
        "col-span-12 md:col-start-3 md:col-span-8 flex flex-col gap-y-10"
      }
    >
      <div className="flex items-center justify-center w-full h-full flex-col gap-y-10 text-center">
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
        <p className="text-gray">
          {MODELS_CONTENT.modelCreation.confirmation.description}
        </p>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <Button variant="dark">
              {MODELS_CONTENT.modelCreation.confirmation.buttons.exploreModels}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
