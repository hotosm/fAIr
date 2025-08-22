const ModelDetailsSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-y-8">
    <h1 className="text-title-2 font-semibold text-dark">{title}</h1>
    {children}
  </section>
);

export default ModelDetailsSection;
