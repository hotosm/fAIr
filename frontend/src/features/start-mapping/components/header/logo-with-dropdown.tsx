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
        className={`block text-nowrap px-4 py-2 text-body-3 text-dark hover:bg-off-white md:text-wrap lg:text-nowrap  ${id === 0 ? "hover:rounded-t-xl" : ""}`}
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
      className="max-w-fit rounded-xl md:w-24 lg:w-fit"
    >
      <div className="flex w-full flex-col rounded-xl bg-white">
        <ul className="flex flex-col">{navItems}</ul>
        <Divider />
        <button
          className="block  w-full px-4 py-2 text-start text-body-3 text-primary hover:rounded-b-xl hover:bg-off-white"
          onClick={goBack}
        >
          Stop Mapping
        </button>
      </div>
    </DropDown>
  );
};
