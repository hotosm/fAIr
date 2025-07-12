import styles from "./header.module.css";

export const Header = ({ title }: { title: string }) => {
  return (
    <header
      className={`${styles.headerBackground} fullscreen relative flex h-44 flex-col justify-between bg-dark px-large py-6  md:flex-row md:items-end lg:px-extra-large`}
    >
      <div className="relative w-fit border-primary text-title-2 font-semibold text-white md:text-title-1">
        {title}
        <span className="absolute bottom-0 left-0 h-2 w-full bg-primary"></span>
      </div>
      <div className="absolute bottom-2 right-large md:right-extra-large">
        <Rectangles />
      </div>
    </header>
  );
};

const Rectangles = () => {
  return (
    <div className="relative h-16 w-36 self-end md:h-20  md:w-40">
      <div className="absolute top-0 h-2 w-36 bg-primary md:w-40"></div>
      <div className="absolute right-0 top-2 h-16 w-8 bg-light-gray md:h-20"></div>
      <div className="absolute inset-x-0 top-2 h-16 w-28 bg-secondary bg-[radial-gradient(circle,var(--hot-fair-color-primary)_0.1px,transparent_1px)] bg-[length:var(--sl-spacing-2x-small)_var(--sl-spacing-2x-small)] md:h-28 md:w-32"></div>
      <div className="absolute -bottom-2 -left-24 h-10 w-24 bg-secondary"></div>
    </div>
  );
};
