import { memo } from "react";
import { DropDown } from "@/components/ui/dropdown";
import { NavLogo } from "@/components/layout";
import { Divider } from "@/components/ui/divider";
import { Link } from "@/components/ui/link";
import { navLinks } from "@/constants/common";
import { DropdownPlacement } from "@/enums";
import { useNavigate } from "react-router-dom";

type BrandLogoWithDropDownProps = {
  isOpened: boolean;
  onClose: () => void;
  onShow: () => void;
}


export const BrandLogoWithDropDown = memo(function BrandLogoWithDropDown({
  isOpened,
  onClose,
  onShow,
}: BrandLogoWithDropDownProps) {

  const navItems = navLinks.map((link, id) => (
    <li
      key={`${link.title}-${id}`}
    >
      <Link
        disableLinkStyle
        title={link.title}
        href={link.href}
        className="text-dark text-body-3 block py-1"
        nativeAnchor={false}
      >
        {link.title}
      </Link>
    </li>
  ))

  const navigate = useNavigate()
  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_START}
      dropdownIsOpened={isOpened}
      onDropdownHide={onClose}
      onDropdownShow={onShow}
      triggerComponent={<NavLogo onClick={() => null} smallerSize />}
      distance={1}
      className="rounded-2xl"
    >
      <div className="bg-white flex flex-col gap-4 p-4 rounded-2xl">
        <ul className="flex flex-col gap-y-2">{navItems}</ul>
        <Divider />
        <button
          className="
            text-body-3
            text-start
            text-primary  
          "
          onClick={() => navigate(-1)}
        >
          Exit
        </button>
      </div>
    </DropDown>
  );
});
