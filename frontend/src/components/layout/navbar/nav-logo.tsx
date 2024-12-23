import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { fAIrLogo } from "@/assets/images";

export const NavLogo = ({
  onClick,
  width = "60px",
  height = "22px",
}: {
  onClick?: () => void;
  width?: string;
  height?: string;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    onClick ? onClick() : navigate(APPLICATION_ROUTES.HOMEPAGE);
  };
  return (
    <button
      onClick={handleClick}
      title={APP_CONTENT.navbar.logoAlt}
      className="flex items-center gap-x-1"
    >
      <Image
        src={fAIrLogo}
        alt={APP_CONTENT.navbar.logoAlt}
        width={width}
        height={height}
      />
      <p className="font-semibold">fAIr</p>
    </button>
  );
};
