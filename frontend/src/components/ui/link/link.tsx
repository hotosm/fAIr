import styles from "./link.module.css";
import { cn } from "@/utils";
import { Link as ReactRouterLink } from "react-router-dom";

type LinkProps = {
  href: string;
  title: string;
  blank?: boolean;
  children: React.ReactNode;
  className?: string;
  nativeAnchor?: boolean;
  disableLinkStyle?: boolean;
  download?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLSpanElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLAnchorElement | HTMLSpanElement>;
};

const Link: React.FC<LinkProps> = ({
  href,
  title,
  blank = false,
  children,
  className,
  nativeAnchor = true,
  disableLinkStyle = false,
  download = false,
  onClick,
  onKeyDown,
}) => {
  const commonProps = {
    title,
    className: cn(`${!disableLinkStyle && styles.link} ${className} `),
    onClick,
    onKeyDown,
  };
  return (
    <>
      {nativeAnchor ? (
        <a
          href={href}
          rel="origin"
          target={blank ? "_blank" : "_self"}
          download={download}
          {...commonProps}
        >
          {children}
        </a>
      ) : (
        <ReactRouterLink to={href} {...commonProps}>
          {children}
        </ReactRouterLink>
      )}
    </>
  );
};

export default Link;
