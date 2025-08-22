const StepHeading = ({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) => {
  return (
    <>
      <h1 className="text-title-1 text-primary md:text-large-title">
        {heading}
      </h1>
      <p className="max-w-3xl text-body-3 text-grey md:text-body-2">
        {description}
      </p>
    </>
  );
};

export default StepHeading;
