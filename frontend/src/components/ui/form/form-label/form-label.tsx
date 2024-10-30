import { ToolTip } from "@/components/ui/tooltip";

type FormLabelProps = {
  label: string;
  required?: boolean;
  withTooltip: boolean;
  toolTipContent: string;
  currentLength?: number;
  maxLength?: number;
};
const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  withTooltip,
  toolTipContent,
  currentLength,
  maxLength,
}) => {
  return (
    <p
      slot="label"
      className="flex text-base items-center gap-x-2 text-dark mb-4"
    >
      <span>
        {label} {required && <small className="text-primary text-xl">*</small>}
      </span>
      {maxLength && (
        <span className={`${currentLength === maxLength && "text-primary"} `}>
          ({currentLength}/{maxLength})
        </span>
      )}
      {withTooltip && <ToolTip content={toolTipContent}></ToolTip>}
    </p>
  );
};

export default FormLabel;
