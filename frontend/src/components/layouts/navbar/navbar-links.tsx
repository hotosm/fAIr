import styles from "@/components/layouts/navbar/navbar.module.css";
import { DropDown } from "@/components/ui/dropdown";
import { Link } from "@/components/ui/link";
import { navLinks } from "@/constants/general";
import { useLocation, useNavigate } from "react-router-dom";

type NavBarLinksProps = {
  className: string;
  setOpen?: (arg: boolean) => void;
};

export const NavBarLinks: React.FC<NavBarLinksProps> = ({ className, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLinkActive = (link: (typeof navLinks)[number]) =>
    location.pathname.includes(link.href) ||
    (link.children?.some((child) => location.pathname.includes(child.href)) ?? false);

  const visibleLinks = navLinks.filter((link) => link.href !== "" && link.active);

  return (
    <ul className={className}>
      {visibleLinks.map((link, id) => (
        <li
          key={`navbar-item-${id}`}
          onClick={() => {
            if (!link.children) setOpen?.(false);
          }}
          className={`${styles.navLinkItem} ${isLinkActive(link) ? styles.activeLink : ""} ${link.children ? "flex items-center" : ""
            }`}
        >
          {link.children ? (
            <DropDown
              disableCheveronIcon={false}
              distance={20}
              triggerComponent={
                <span className="cursor-pointer capitalize bg-transparent border-none p-0 font-inherit text-inherit text-[length:var(--hot-fair-font-size-body-text-2base)] xl:text-[length:var(--hot-fair-font-size-body-text-2)]">
                  {link.title}
                </span>
              }
              menuItems={link.children.map((child) => ({
                value: child.title,
                name: child.title,
                className: "!uppercase hover:bg-gray-50 !capitalize",
                onClick: (e: any) => {
                  e?.stopPropagation();
                  navigate(child.href);
                  setOpen?.(false);
                },
              }))}
            />
          ) : (
            <Link href={link.href} title={link.title} nativeAnchor={false} className="capitalize">
              {link.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};