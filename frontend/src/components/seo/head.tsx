import { Helmet } from "react-helmet-async";

type HeadProps = {
  title?: string;
  description?: string;
};

export const Head = ({ title = "", description = "" }: HeadProps = {}) => {
  return (
    <Helmet>
      <title>
        {title
          ? `${title} | fAIr | Humanitarian OpenStreetMap Team (HOT)`
          : undefined}
      </title>
      <meta name="description" content={description} />
    </Helmet>
  );
};

export default Head;
