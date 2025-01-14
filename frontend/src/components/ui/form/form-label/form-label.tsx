import { ToolTip } from "@/components/ui/tooltip";

type FormLabelProps = {
  label: string;
  required?: boolean;
  withTooltip: boolean;
  toolTipContent: string;
  currentLength?: number;
  maxLength?: number;
  position?: "top" | "left";
};
const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  withTooltip,
  toolTipContent,
  currentLength,
  maxLength,
  position = "top",
}) => {
  return (
    <p
      slot="label"
      className={`flex text-body-3 items-center gap-x-2 text-dark ${position === "top" && "mb-4"}`}
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
