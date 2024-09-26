import styles from "./link.module.css";

type LinkProps = {
  href: string;
  title: string;
  blank?: boolean;
  children: React.ReactNode;
  className?: string;
};

const Link: React.FC<LinkProps> = ({
  href,
  title,
  blank = false,
  children,
  className,
}) => {
  return (
    <a
      href={href}
      title={title}
      target={blank ? "_blank" : "_self"}
      className={`${styles.link} ${className}`}
    >
      {children}
    </a>
  );
};

export default Link;
