const ModelDetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <p className="text-body-2 text-dark">
    <span className="text-grey">{label}: </span>
    {value}
  </p>
);

export default ModelDetailItem;
