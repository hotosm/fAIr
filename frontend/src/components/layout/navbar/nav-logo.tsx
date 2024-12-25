import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/assets/svgs";

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

  const width = smallerSize ? "50px" : "60px";
  const height = smallerSize ? "50px" : "22px";

  return (
    <button
      onClick={handleClick}
      title={APP_CONTENT.navbar.logoAlt}
      className="flex items-center gap-x-1"
    >
      <Image
        src={BrandLogo}
        alt={APP_CONTENT.navbar.logoAlt}
        width={width}
        height={height}
      />
      <p className="font-semibold text-body-2">fAIr</p>
    </button>
  );
};
