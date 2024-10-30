import ModelCreationSuccess from "@/assets/images/model_creation_success.png";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import ConfettiExplosion from "react-confetti-explosion";

const ModelCreationSuccessConfirmation = () => {
  return (
    <div className="flex items-center justify-center w-full h-full flex-col gap-y-10 text-center">
      <ConfettiExplosion
        force={0.2}
        duration={5000}
        particleCount={250}
        height={10000}
      />
      <Image src={ModelCreationSuccess} alt="Model Creation Success Icon" />
      <p className="text-title-2">Model 15 is Created!</p>
      <p className="text-gray">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore.
      </p>
      <div className="flex items-center justify-between gap-x-4">
        <Button>go to model</Button>
        <Button variant="dark">Explore My models</Button>
      </div>
    </div>
  );
};

export default ModelCreationSuccessConfirmation;
