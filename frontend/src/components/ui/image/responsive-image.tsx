type ResponsiveImageProps = {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  height?: string;
  className?: string;
  placeHolder?: string;
};

/**
 *
 * @param param0
 * @returns
 * Responsive image tool: https://www.responsivebreakpoints.com/
 */
// eslint-disable-next-line no-empty-pattern
export const ResponsiveImage = ({}: ResponsiveImageProps) => {
  return (
    <picture>
      <source srcSet="" />
      <source />
      <source />
      <img />
    </picture>
  );
};
