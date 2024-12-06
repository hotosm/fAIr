import { useModelsContext } from "@/app/providers/models-provider";
import ModelFormConfirmation from "@/assets/images/model_creation_success.png";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES, MODEL_CREATION_CONTENT } from "@/utils";
import ConfettiExplosion from "react-confetti-explosion";
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
          {MODEL_CREATION_CONTENT.confirmation.description}
        </p>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link
            href={`${APPLICATION_ROUTES.MODELS}/${modelId}`}
            title={MODEL_CREATION_CONTENT.confirmation.buttons.goToModel}
            nativeAnchor={false}
          >
            <Button>
              {MODEL_CREATION_CONTENT.confirmation.buttons.goToModel}
            </Button>
          </Link>
          <Link
            href={`${APPLICATION_ROUTES.MODELS}`}
            title={MODEL_CREATION_CONTENT.confirmation.buttons.exploreModels}
          >
            <Button variant="dark">
              {MODEL_CREATION_CONTENT.confirmation.buttons.exploreModels}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
