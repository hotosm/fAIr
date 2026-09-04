import { useEffect, useRef } from "react";

type HeadProps = {
  title?: string;
  description?: string;
};

const Head = ({ title, description }: HeadProps = {}) => {
  const defaultTitle = useRef<string>(document.title);

  useEffect(() => {
    const fullTitle = title
      ? `${title} | fAIr - Humanitarian OpenStreetMap Team (HOT)`
      : defaultTitle.current;
    document.title = fullTitle;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');

    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    } else if (meta) {
      document.head.removeChild(meta);
    }
  }, [title, description]);

  return null;
};

export default Head;
