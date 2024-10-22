import { cn } from "@/utils";
import styles from "./link.module.css";
import { Link as ReactRouterLink } from "react-router-dom";

type LinkProps = {
  href: string;
  title: string;
  blank?: boolean;
  children: React.ReactNode;
  className?: string;
  nativeAnchor?: boolean;
  disableLinkStyle?: boolean;
  download?:boolean 
};

const Link: React.FC<LinkProps> = ({
  href,
  title,
  blank = false,
  children,
  className,
  nativeAnchor = true,
  disableLinkStyle = false,
  download=false 
}) => {
  return (
    <>
      {nativeAnchor ? (
        <a
          href={href}
          title={title}
          rel='origin'
          target={blank ? "_blank" : "_self"}
          className={cn(`${styles.link} ${className}`)}
          download={download}
        >
          {children}
        </a>
      ) : (
        <ReactRouterLink
          to={href}
          className={cn(`${!disableLinkStyle && styles.link} ${className}`)}
          title={title}
        >
          {children}
        </ReactRouterLink>
      )}
    </>
  );
};

export default Link;
