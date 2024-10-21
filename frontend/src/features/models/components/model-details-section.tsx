const ModelDetailsSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-y-8">
    <h1 className="font-semibold text-dark text-title-2">{title}</h1>
    {children}
  </section>
);

export default ModelDetailsSection;
