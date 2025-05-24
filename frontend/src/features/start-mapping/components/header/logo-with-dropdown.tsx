import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { Link } from "@/components/ui/link";
import { navLinks } from "@/constants/general";
import { NavLogo } from "@/components/layouts";
import { useHistory } from "@/hooks/use-history";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

export const BrandLogoWithDropDown = () => {
  const { goBack } = useHistory();
  const { dropdownRef } = useDropdownMenu();
  const navItems = navLinks.map((link, id) => (
    <li key={`${link.title}-${id}`}>
      <Link
        disableLinkStyle
        title={link.title}
        href={link.href}
        className={`text-dark text-nowrap md:text-wrap lg:text-nowrap text-body-3 block hover:bg-off-white py-2 px-4  ${id === 0 ? "hover:rounded-t-xl" : ""}`}
        nativeAnchor={false}
      >
        {link.title}
      </Link>
    </li>
  ));
  return (
    <DropDown
      ref={dropdownRef}
      placement={DropdownPlacement.BOTTOM_START}
      triggerComponent={<NavLogo onClick={() => null} smallerSize />}
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      className="rounded-xl md:w-24 lg:w-fit max-w-fit"
    >
      <div className="bg-white flex flex-col rounded-xl w-full">
        <ul className="flex flex-col">{navItems}</ul>
        <Divider />
        <button
          className="text-body-3  block w-full px-4 py-2 text-start hover:bg-off-white hover:rounded-b-xl text-primary"
          onClick={goBack}
        >
          Stop Mapping
        </button>
      </div>
    </DropDown>
  );
};
