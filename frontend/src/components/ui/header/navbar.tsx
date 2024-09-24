import { Button } from '@/components/ui/button'
import styles from './header.module.css'
import HOTFairLogo from '@/assets/hot_fair_logo.svg'
import HamburgerIcon from '@/assets/hamburger_icon.svg'
import { Drawer } from '@/components/ui/drawer'
import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Image } from '@/components/ui/image'
import { APP_CONTENT } from '@/utils/content'
import { authService } from '@/services'
import { HOT_FAIR_SESSION_REDIRECT_KEY, useAuth } from '@/app/providers/auth-provider'
import { useLocation } from 'react-router-dom'
import { useSessionStorage } from '@/hooks/storage'
import UserProfile from './user-profile'



const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const { setValue } = useSessionStorage();

  const handleLogin = async () => {
    const currentPath = location.pathname;
    setValue(HOT_FAIR_SESSION_REDIRECT_KEY, currentPath);
    await authService.initializeOAuthFlow();
  }

  return (
    <>
      <Drawer open={open} setOpen={setOpen} placement='end'>
        <div className={styles.drawerContentContainer}>
          <div className={styles.drawerHeaderContainer}>
            <Link href='/' title={APP_CONTENT.navbar.logoAlt}>
              <Image src={HOTFairLogo} alt={APP_CONTENT.navbar.logoAlt} width='125px' height='72px' />
            </Link>
            <button onClick={() => setOpen(false)} className={styles.closeButton}>
              &#x2715;
            </button>
          </div>
          <div className={styles.navLinksContainer}>
            <NavBarLinks className={styles.mobileNavLinks} />
          </div>
          <div className={styles.loginButtonContainer}>
            {
              isAuthenticated ? <UserProfile logout={logout} user={user} /> :
                <Button variant='primary' onClick={handleLogin}>{APP_CONTENT.navbar.loginButton}</Button>
            }
          </div>
        </div>
      </Drawer>
      <nav className={styles.nav}>
        <div>
          <Link href='/' title={APP_CONTENT.navbar.logoAlt}>
            <Image src={HOTFairLogo} alt={APP_CONTENT.navbar.logoAlt} width='125px' height='72px' />
          </Link>
        </div>
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div>
          {
            isAuthenticated ?
              <div className={styles.profileContainer}>
                <UserProfile logout={logout} user={user} />
              </div> :
              <Button variant='primary' className={styles.loginButton} onClick={handleLogin}>{APP_CONTENT.navbar.loginButton}</Button>
          }
        </div>
        <button className={styles.hamburgerMenu} onClick={() => setOpen(true)}>
          <Image src={HamburgerIcon} alt={APP_CONTENT.navbar.hamburgerMenuAlt} title={APP_CONTENT.navbar.hamburgerMenuTitle} width='20px' height='20px' />
        </button>
      </nav>
    </>
  )
}

export default NavBar




type TNavBarLinks = {
  title: string
  href: string
}[]

const navLinks: TNavBarLinks = [
  {
    title: APP_CONTENT.navbar.routes.exploreModels,
    href: '#'
  },
  {
    title: APP_CONTENT.navbar.routes.learn,
    href: '#'
  },
  {
    title: APP_CONTENT.navbar.routes.about,
    href: '#'
  },
  {
    title: APP_CONTENT.navbar.routes.resources,
    href: '#'
  }
]

type NavBarLinksProps = {
  className: string
}

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className }) => {
  return (
    <ul className={className}>
      {
        navLinks.map((link, id) => (
          <li key={`navbar-item-${id}`}>
            <Link href={link.href} title={link.title}>{link.title}</Link>
          </li>
        ))
      }
    </ul>
  )
}