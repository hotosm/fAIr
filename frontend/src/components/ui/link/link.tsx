import styles from "./link.module.css";
import { Link as ReactRouterLink } from "react-router-dom";


type LinkProps = {
  href: string;
  title: string;
  blank?: boolean;
  children: React.ReactNode;
  className?: string;
  nativeAnchor?: boolean
};

const Link: React.FC<LinkProps> = ({
  href,
  title,
  blank = false,
  children,
  className,
  nativeAnchor = true
}) => {
  return (
    <>
      {
        nativeAnchor ? <a
          href={href}
          title={title}
          target={blank ? "_blank" : "_self"}
          className={`${styles.link} ${className}`}
        >
          {children}
        </a> :
          <ReactRouterLink to={href} className={`${styles.link} ${className}`} title={title}>
            {children}
          </ReactRouterLink>
      }
    </>
  );
};

export default Link;
