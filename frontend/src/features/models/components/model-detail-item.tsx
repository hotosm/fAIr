const ModelDetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <p className="text-dark text-body-2">
    <span className="text-grey">{label}: </span>
    {value}
  </p>
);

export default ModelDetailItem;
