import { Button } from "@/components/ui/button";
import styles from "@/components/layout/navbar/navbar.module.css";
import { Drawer } from "@/components/ui/drawer";
import { useState } from "react";
import { Link } from "@/components/ui/link";
import { Image } from "@/components/ui/image";
import { SHARED_CONTENT } from "@/constants";
import { useAuth } from "@/app/providers/auth-provider";
import { UserProfile } from "@/components/layout";
import { useLogin } from "@/hooks/use-login";
import { useLocation } from "react-router-dom";
import { DrawerPlacements } from "@/enums";
import { NavLogo } from "@/components/layout";
import { HamburgerIcon } from "@/assets/svgs";
import { navLinks } from "@/constants/general";

export const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { handleLogin, loading } = useLogin();

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
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <Button variant="primary" onClick={handleLogin} spinner={loading}>
                {loading
                  ? SHARED_CONTENT.loginButtonLoading
                  : SHARED_CONTENT.navbar.loginButton}
              </Button>
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
          {isAuthenticated ? (
            <div className={styles.profileContainer}>
              <UserProfile />
            </div>
          ) : (
            <Button
              variant="primary"
              className={styles.loginButton}
              onClick={handleLogin}
              spinner={loading}
            >
              {loading
                ? SHARED_CONTENT.loginButtonLoading
                : SHARED_CONTENT.navbar.loginButton}
            </Button>
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
