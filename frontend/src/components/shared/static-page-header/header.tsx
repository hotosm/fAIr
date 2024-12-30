import styles from './header.module.css';

export const Header = ({ title }: { title: string }) => {
  return (
    <header
      className={`${styles.headerBackground} h-44 bg-dark flex flex-col md:flex-row fullscreen px-large lg:px-extra-large md:items-end  py-6 justify-between relative`}
    >
      <div className="relative text-title-2 md:text-title-1 text-white border-primary font-semibold w-fit">
        {title}
        <span className="absolute left-0 bottom-0 bg-primary h-2 w-full"></span>
      </div>
      <div className="right-large md:right-extra-large absolute bottom-2">
        <Rectangles />
      </div>
    </header>
  );
};

const Rectangles = () => {
  return (
    <div className="relative w-36 md:w-40 h-16 md:h-20  self-end">
      <div className="absolute w-36 md:w-40 h-2 top-0 bg-primary"></div>
      <div className="absolute w-8 h-16 md:h-20 top-2 right-0 bg-light-gray"></div>
      <div className="absolute w-28 md:w-32 top-2 h-16 md:h-28 bg-secondary left-0 right-0 bg-[radial-gradient(circle,var(--hot-fair-color-primary)_0.1px,transparent_1px)] bg-[length:var(--sl-spacing-2x-small)_var(--sl-spacing-2x-small)]"></div>
      <div className="absolute -bottom-2 w-24 h-10 -left-24 bg-secondary"></div>
    </div>
  );
};
