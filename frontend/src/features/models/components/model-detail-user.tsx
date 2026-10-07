import { Link } from "@/components/ui/link";

const ModelDetailUser = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <p className="text-dark text-body-2">
    <span className="text-grey">{label}: </span>
    <Link
      nativeAnchor={false}
      disableLinkStyle
      href={`https://www.openstreetmap.org/user/${value}`}
      title={label}
      blank
    >
      {value}
    </Link>
  </p>
);

export default ModelDetailUser;
