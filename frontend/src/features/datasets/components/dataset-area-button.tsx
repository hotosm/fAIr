import { ChevronDownIcon } from "@/components/ui/icons";

export const DatasetAreaButton = ({
  disabled,
  onClick,
}: {
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      className={`flex items-center gap-x-2 text-nowrap text-body-3 md:self-end md:text-body-2 md:font-semibold ${disabled ? "cursor-not-allowed text-grey" : "cursor-pointer  text-primary"}`}
      onClick={onClick}
    >
      <p>View Dataset Area</p>
      <ChevronDownIcon className="icon -rotate-90" />
    </button>
  );
};
