import styles from "@/components/layouts/navbar/navbar.module.css";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { NavLogo } from "@/components/layouts";
import { useAuth } from "@/app/providers/auth-provider";
import { useLocation } from "react-router-dom";
import { useLogin } from "@/hooks/use-login";
import { UserProfile } from "@/components/layouts";
import { useState } from "react";
import {
  AUTH_PROVIDER,
  BASE_API_URL,
  FRONTEND_URL,
  HANKO_URL,
} from "@/config";

if (AUTH_PROVIDER === "hanko") {
  import("@hotosm/hanko-auth");
}

const HankoAuthComponent = () => (
  <hotosm-auth
    hanko-url={HANKO_URL}
    base-path={HANKO_URL}
    redirect-after-login={FRONTEND_URL}
    redirect-after-logout={FRONTEND_URL}
    mapping-check-url={`${BASE_API_URL}auth/status/`}
    app-id="fair"
  />
);

export const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { handleLogin, loading } = useLogin();

  const LegacyLoginButton = ({ className }: { className?: string }) => (
    <Button className={className} onClick={handleLogin} spinner={loading}>
      {loading
        ? SHARED_CONTENT.loginButtonLoading
        : SHARED_CONTENT.navbar.loginButton}
    </Button>
  );

  return (
    <>
      <Drawer open={open} setOpen={setOpen} placement={DrawerPlacements.END}>
        <div className={styles.drawerContentContainer}>
          <div className={styles.drawerHeaderContainer}>
            <NavLogo />
            <button
              onClick={() => setOpen(false)}
              className={styles.closeButton}
            >
              &#x2715;
            </button>
          </div>
          <div className={styles.navLinksContainer}>
            <NavBarLinks className={styles.mobileNavLinks} setOpen={setOpen} />
          </div>
          <div className={styles.loginButtonContainer}>
            {AUTH_PROVIDER === "hanko" ? (
              <HankoAuthComponent />
            ) : isAuthenticated ? (
              <UserProfile setOpen={setOpen} />
            ) : (
              <LegacyLoginButton />
            )}
          </div>
        </div>
      </Drawer>
      <nav className={`${styles.nav} app-padding`}>
        <NavLogo />
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div>
          {AUTH_PROVIDER === "hanko" ? (
            <HankoAuthComponent />
          ) : isAuthenticated ? (
            <div className={styles.profileContainer}>
              <UserProfile />
            </div>
          ) : (
            <LegacyLoginButton className={styles.loginButton} />
          )}
        </div>
        <button className={styles.hamburgerMenu} onClick={() => setOpen(true)}>
          <Image
            src={HamburgerIcon}
            alt={SHARED_CONTENT.navbar.hamburgerMenuAlt}
            title={SHARED_CONTENT.navbar.hamburgerMenuTitle}
            width="20px"
            height="20px"
          />
        </button>
      </nav>
    </>
  );
};

type TNavBarLinks = {
  title: string;
  href: string;
}[];

const navLinks: TNavBarLinks = [
  {
    title: SHARED_CONTENT.navbar.routes.exploreModels,
    href: APPLICATION_ROUTES.MODELS,
  },
  {
    title: SHARED_CONTENT.navbar.routes.learn,
    href: APPLICATION_ROUTES.LEARN_BASE,
  },
  {
    title: SHARED_CONTENT.navbar.routes.about,
    href: APPLICATION_ROUTES.ABOUT,
  },
  {
    title: SHARED_CONTENT.navbar.routes.resources,
    href: APPLICATION_ROUTES.RESOURCES,
  },
];

type NavBarLinksProps = {
  className: string;
  setOpen?: (arg: boolean) => void;
};

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className, setOpen }) => {
  const location = useLocation();

  return (
    <ul className={className}>
      {navLinks.map((link, id) => (
        <li
          key={`navbar-item-${id}`}
          onClick={() => {
            //close the drawer after navigating to a new page on mobile
            setOpen && setOpen(false);
          }}
          className={`${styles.navLinkItem} ${location.pathname.includes(link.href) && styles.activeLink}`}
        >
          <Link href={link.href} title={link.title} nativeAnchor={false}>
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  );
};
