import { Divider } from '@/components/ui/divider';
import { DropDown } from '@/components/ui/dropdown';
import { DropdownPlacement } from '@/enums';
import { ELEMENT_DISTANCE_FROM_NAVBAR } from '@/constants';
import { Link } from '@/components/ui/link';
import { navLinks } from '@/constants/general';
import { NavLogo } from '@/components/layout';
import { useNavigate } from 'react-router-dom';

type BrandLogoWithDropDownProps = {
  isOpened: boolean;
  onClose: () => void;
  onShow: () => void;
};

export const BrandLogoWithDropDown = function BrandLogoWithDropDown({
  isOpened,
  onClose,
  onShow,
}: BrandLogoWithDropDownProps) {
  const navItems = navLinks.map((link, id) => (
    <li key={`${link.title}-${id}`}>
      <Link
        disableLinkStyle
        title={link.title}
        href={link.href}
        className={`text-dark text-nowrap text-body-3 block hover:bg-off-white py-2 px-4  ${id === 0 ? "hover:rounded-t-xl" : ""}`}
        nativeAnchor={false}
      >
        {link.title}
      </Link>
    </li>
  ));

  const navigate = useNavigate();
  return (
    <DropDown
      placement={DropdownPlacement.BOTTOM_START}
      dropdownIsOpened={isOpened}
      onDropdownHide={onClose}
      onDropdownShow={onShow}
      triggerComponent={<NavLogo onClick={() => null} smallerSize />}
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      className="rounded-xl"
    >
      <div className="bg-white flex flex-col rounded-xl w-full">
        <ul className="flex flex-col">{navItems}</ul>
        <Divider />
        <button
          className="text-body-3  block w-full px-4 py-2 text-start hover:bg-off-white hover:rounded-b-xl text-primary"
          onClick={() => navigate(-1)}
        >
          Stop Mapping
        </button>
      </div>
    </DropDown>
  );
};
