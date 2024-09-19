import Button from '../button/button'
import './styles.css'
import HOTFairLogo from '@/assets/hot_fair_logo.svg'

type NavBarLinks = {
  title: string
  href: string
}[]

const navLinks: NavBarLinks = [
  {
    title: 'Explore Models',
    href: '#'
  },
  {
    title: 'Learn',
    href: '#'
  },
  {
    title: 'About',
    href: '#'
  },
  {
    title: 'Resources',
    href: '#'
  }
]

const NavBar = () => {
  return (
    <nav>
      <img src={HOTFairLogo} alt='HOT fAIr Logo' title='HOT fAIr Logo'></img>
      <ul>
        {navLinks.map((link, id) => (
          <li key={`navbar-item-${id}`}>
            <a href={link.href}>{link.title}</a>
          </li>
        ))}
      </ul>
      <Button variant='primary'>Login</Button>
    </nav>
  )
}

export default NavBar
