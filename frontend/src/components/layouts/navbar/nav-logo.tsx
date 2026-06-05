import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { HOTLogo } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { useLocation, useNavigate } from "react-router-dom";
import { FAIR_PROD_URL } from "@/config";

export const NavLogo = ({
  onClick,
  smallerSize,
}: {
  onClick?: () => void;
  smallerSize?: boolean;
}) => {
  const { pathname } = useLocation();
  const isTryFairPage = pathname.includes(APPLICATION_ROUTES.TRY_FAIR);

  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isTryFairPage) {
      window.location.href = FAIR_PROD_URL;
    } else {
      navigate(APPLICATION_ROUTES.HOMEPAGE);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={SHARED_CONTENT.navbar.logoAlt}
      className="flex items-center gap-2"
    >
      <Image
        src={HOTLogo}
        alt={SHARED_CONTENT.navbar.logoAlt}
        className={smallerSize ? "w-10 h-10" : "w-12 h-12 md:w-16 md:h-16"}
      />
      <p
        className={`font-barlow font-bold text-dark leading-[1.2] ${smallerSize ? "text-body-2" : "text-body-1 md:text-title-2"}`}
      >
        fAIr
      </p>
    </button>
  );
};
