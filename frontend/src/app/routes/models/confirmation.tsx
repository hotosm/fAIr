import { useModelsContext } from "@/app/providers/models-provider";
import ModelFormConfirmation from "@/assets/images/model_creation_success.png";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import ModelEnhancementDialog from "@/features/models/components/dialogs/model-enhancement-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { APPLICATION_ROUTES, MODEL_CREATION_CONTENT } from "@/utils";
import ConfettiExplosion from "react-confetti-explosion";
import { useNavigate, useSearchParams } from "react-router-dom";

export const ModelConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get("id");
  const { formData } = useModelsContext();
  const { isOpened, openDialog, closeDialog } = useDialog();
  const navigate = useNavigate();

  const handleClick = () => {
    if (formData.trainingRequestIsSuccessful) {
      navigate(`${APPLICATION_ROUTES.MODELS}/${modelId}`)
    } else {
      openDialog()
    }
  }
  return (
    <>
      <ModelEnhancementDialog isOpened={isOpened} closeDialog={closeDialog} modelId={modelId as string} />
      <div className={"col-start-3 col-span-8 flex flex-col gap-y-10"}>
        <div className="flex items-center justify-center w-full h-full flex-col gap-y-10 text-center">
          <ConfettiExplosion
            force={0.2}
            duration={5000}
            particleCount={250}
            height={10000}
          />
          <Image src={ModelFormConfirmation} alt="Model Creation Success Icon" />
          <p className="text-title-2">Model {modelId} is Created!</p>
          <p className="text-gray">
            {formData.trainingRequestMessage}
          </p>
          <div className="flex items-center justify-between gap-x-4">
            <Button onClick={handleClick}>
              {formData.trainingRequestIsSuccessful ? MODEL_CREATION_CONTENT.confirmation.buttons.goToModel : MODEL_CREATION_CONTENT.confirmation.buttons.enhanceModel}
            </Button>
            <Link
              href={!formData.trainingRequestIsSuccessful ? `${APPLICATION_ROUTES.MODELS}/${modelId}` : `${APPLICATION_ROUTES.MODELS}`}
              title={!formData.trainingRequestIsSuccessful ? MODEL_CREATION_CONTENT.confirmation.buttons.goToModel : MODEL_CREATION_CONTENT.confirmation.buttons.exploreModels}
            >
              <Button variant="dark">
                {!formData.trainingRequestIsSuccessful ? MODEL_CREATION_CONTENT.confirmation.buttons.goToModel : MODEL_CREATION_CONTENT.confirmation.buttons.exploreModels}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
