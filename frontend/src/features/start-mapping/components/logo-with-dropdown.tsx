import { NavLogo } from "@/components/layout";
import { BackButton } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { APPLICATION_ROUTES } from "@/utils";
import { useNavigate } from "react-router-dom";

export const BrandLogoWithDropDown = ({
  isOpened,
  onClose,
  onShow,
}: {
  isOpened: boolean;
  onClose: () => void;
  onShow: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <DropDown
      placement="top-end"
      dropdownIsOpened={isOpened}
      onDropdownHide={onClose}
      onDropdownShow={onShow}
      triggerComponent={<NavLogo onClick={() => null} smallerSize />}
      distance={1}
    >
      <div className="bg-white flex flex-col gap-4 w-40 p-4 rounded-md">
        <BackButton className="text-body-3" />
        <Divider />
        <button
          onClick={() => navigate(APPLICATION_ROUTES.MODELS)}
          className="text-left text-body-3 hover:bg-secondary p-2"
        >
          Explore Models
        </button>
        <button
          onClick={() => navigate(APPLICATION_ROUTES.HOMEPAGE)}
          className="text-left  text-body-3  hover:bg-secondary p-2"
        >
          Home
        </button>
      </div>
    </DropDown>
  );
};
