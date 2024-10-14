import { useState } from "react";

type ImageProps = {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  height?: string;
  className?: string;
  placeHolder?: any
};

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  title,
  width,
  height,
  className,
  placeHolder
}) => {


  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    setImageSrc(placeHolder);
  };
  return (
    <img
      src={imageSrc}
      alt={alt}
      title={title || alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    ></img>
  );
};

export default Image;
