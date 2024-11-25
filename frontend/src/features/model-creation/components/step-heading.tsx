const StepHeading = ({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) => {
  return (
    <>
      <h1 className="text-large-title text-primary">{heading}</h1>
      <p className="text-gray text-body-2">{description}</p>
    </>
  );
};

export default StepHeading;
