
import ModelCreationSuccess from "@/assets/images/model_creation_success.png";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/utils";
import ConfettiExplosion from "react-confetti-explosion";
import { useSearchParams } from "react-router-dom";

const ModelCreationSuccessConfirmation = () => {

  const [searchParams] = useSearchParams();
  // Model ID should be in the url params upon successful creation
  const modelId = searchParams.get("id");

  return (
    <div className="flex items-center justify-center w-full h-full flex-col gap-y-10 text-center">
      <ConfettiExplosion
        force={0.2}
        duration={5000}
        particleCount={250}
        height={10000}
      />
      <Image src={ModelCreationSuccess} alt="Model Creation Success Icon" />
      <p className="text-title-2">Model {modelId} is Created!</p>
      <p className="text-gray">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore.
      </p>
      <div className="flex items-center justify-between gap-x-4">
        <Link
          href={`${APPLICATION_ROUTES.MODELS}/${modelId}`}
          title="go to model"
        >
          <Button>go to model</Button>
        </Link>
        <Link href={`${APPLICATION_ROUTES.MODELS}`} title="go to model">
          <Button variant="dark">Explore models</Button>
        </Link>
      </div>
    </div>
  );
};

export default ModelCreationSuccessConfirmation;
