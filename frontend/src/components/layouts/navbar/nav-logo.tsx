import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { fAIrLogo } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";

export const NavLogo = ({}: { onClick?: () => void }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(APPLICATION_ROUTES.HOMEPAGE);
  };

  return (
    <button
      onClick={handleClick}
      title={SHARED_CONTENT.navbar.logoAlt}
      className="flex items-center gap-2"
    >
      <Image
        src={fAIrLogo}
        alt={SHARED_CONTENT.navbar.logoAlt}
        className={"size-8 md:size-10"}
      />
      <p
        className={`font-bold text-dark leading-[1.2] text-body-1 md:text-title-2`}
      >
        fAIr
      </p>
    </button>
  );
};
