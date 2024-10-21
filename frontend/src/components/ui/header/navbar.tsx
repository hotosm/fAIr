import { Button } from "@/components/ui/button";
import styles from "./header.module.css";
import HOTFairLogo from "@/assets/hot_fair_logo.svg";
import HamburgerIcon from "@/assets/hamburger_icon.svg";
import { Drawer } from "@/components/ui/drawer";
import { useState } from "react";
import { Link } from "@/components/ui/link";
import { Image } from "@/components/ui/image";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { useAuth } from "@/app/providers/auth-provider";
import UserProfile from "@/components/ui/header/user-profile";
import { useLogin } from "@/hooks/use-login";
import { useLocation } from "react-router-dom";

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { handleLogin, loading } = useLogin();

  return (
    <>
      <Drawer open={open} setOpen={setOpen} placement="end">
        <div className={styles.drawerContentContainer}>
          <div className={styles.drawerHeaderContainer}>
            <Link href="/" title={APP_CONTENT.navbar.logoAlt}>
              <Image
                src={HOTFairLogo}
                alt={APP_CONTENT.navbar.logoAlt}
                width="125px"
                height="72px"
              />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className={styles.closeButton}
            >
              &#x2715;
            </button>
          </div>
          <div className={styles.navLinksContainer}>
            <NavBarLinks className={styles.mobileNavLinks} setOpen={setOpen}/>
          </div>
          <div className={styles.loginButtonContainer}>
            {isAuthenticated ? (
              <UserProfile logout={logout} user={user} />
            ) : (
              <Button variant="primary" onClick={handleLogin} spinner={loading}>
                {loading
                  ? APP_CONTENT.loginButtonLoading
                  : APP_CONTENT.navbar.loginButton}
              </Button>
            )}
          </div>
        </div>
      </Drawer>
      <nav className={styles.nav}>
        <div>
          <Link
            href="/"
            title={APP_CONTENT.navbar.logoAlt}
            nativeAnchor={false}
          >
            <Image
              src={HOTFairLogo}
              alt={APP_CONTENT.navbar.logoAlt}
              width="125px"
              height="72px"
            />
          </Link>
        </div>
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div>
          {isAuthenticated ? (
            <div className={styles.profileContainer}>
              <UserProfile logout={logout} user={user} />
            </div>
          ) : (
            <Button
              variant="primary"
              className={styles.loginButton}
              onClick={handleLogin}
              spinner={loading}
            >
              {loading
                ? APP_CONTENT.loginButtonLoading
                : APP_CONTENT.navbar.loginButton}
            </Button>
          )}
        </div>
        <button className={styles.hamburgerMenu} onClick={() => setOpen(true)}>
          <Image
            src={HamburgerIcon}
            alt={APP_CONTENT.navbar.hamburgerMenuAlt}
            title={APP_CONTENT.navbar.hamburgerMenuTitle}
            width="20px"
            height="20px"
          />
        </button>
      </nav>
    </>
  );
};

export default NavBar;

type TNavBarLinks = {
  title: string;
  href: string;
}[];

const navLinks: TNavBarLinks = [
  {
    title: APP_CONTENT.navbar.routes.exploreModels,
    href: APPLICATION_ROUTES.MODELS,
  },
  {
    title: APP_CONTENT.navbar.routes.learn,
    href: APPLICATION_ROUTES.LEARN,
  },
  {
    title: APP_CONTENT.navbar.routes.about,
    href: APPLICATION_ROUTES.ABOUT,
  },
  {
    title: APP_CONTENT.navbar.routes.resources,
    href: APPLICATION_ROUTES.RESOURCES,
  },
];

type NavBarLinksProps = {
  className: string;
  setOpen?:(arg:boolean)=>void 
};

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className,setOpen }) => {
  const location = useLocation();

  return (
    <ul className={className}>
      {navLinks.map((link, id) => (
        <li
          key={`navbar-item-${id}`}
          onClick={()=>{
            //close the drawer after navigating to a new page on mobile
            setOpen && setOpen(false)
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
