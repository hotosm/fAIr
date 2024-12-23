import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { Image } from "@/components/ui/image";
import HOTFairLogo from "@/assets/svgs/hot_fair_logo.svg";
import { useNavigate } from "react-router-dom";

const NavLogo = ({
  onClick,
  width = "125px",
  height = "72px",
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
    <button onClick={handleClick} title={APP_CONTENT.navbar.logoAlt}>
      <Image
        src={HOTFairLogo}
        alt={APP_CONTENT.navbar.logoAlt}
        width={width}
        height={height}
      />
    </button>
  );
};

export default NavLogo;
