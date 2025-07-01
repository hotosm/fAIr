import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { HOTLogo } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";

export const NavLogo = ({
  onClick,
  smallerSize,
}: {
  onClick?: () => void;
  smallerSize?: boolean;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    onClick ? onClick() : navigate(APPLICATION_ROUTES.HOMEPAGE);
  };

  const width = smallerSize ? "40px" : "60px";
  const height = smallerSize ? "40px" : "22px";

  return (
    <button
      onClick={handleClick}
      title={SHARED_CONTENT.navbar.logoAlt}
      className="flex items-center gap-x-2"
    >
      <Image
        src={HOTLogo}
        alt={SHARED_CONTENT.navbar.logoAlt}
        width={width}
        height={height}
      />
      <p className="font-semibold text-sm md:text-body-1 font-barlow">fAIr</p>
    </button>
  );
};
