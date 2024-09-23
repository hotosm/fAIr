
import styles from './link.module.css'

type TLink = {
    href: string
    title: string
    blank?: boolean
    children: React.ReactNode
}

const Link: React.FC<TLink> = ({ href, title, blank = false, children }) => {
    return (
        <a href={href} title={title} target={blank ? '_blank' : "_self"} className={styles.link}>
            {children}
        </a>
    )
}

export default Link