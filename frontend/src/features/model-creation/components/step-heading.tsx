const StepHeading = ({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) => {
  return (
    <>
      <h1 className="text-body-1 md:text-title-3 text-primary text-3xl font-bold">
        {heading}
      </h1>
      <p className="text-grey text-body-3 md:text-body-2 max-w-3xl">
        {description}
      </p>
    </>
  );
};

export default StepHeading;
