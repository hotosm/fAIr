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
