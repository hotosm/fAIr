const StepHeading = ({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) => {
  return (
    <>
      <h1 className="text-large-title text-primary font-semibold">{heading}</h1>
      <p className="text-gray text-base">{description}</p>
    </>
  );
};

export default StepHeading;
