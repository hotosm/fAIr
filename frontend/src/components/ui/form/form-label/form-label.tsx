import { ToolTip } from "@/components/ui/tooltip";

type FormLabelProps = {
  label: string;
  required?: boolean;
  withTooltip: boolean;
  toolTipContent: string;
  currentLength?: number;
  maxLength?: number;
  minLength?: number;
  position?: "top" | "left";
};
const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  withTooltip,
  toolTipContent,
  currentLength = 0,
  maxLength,
  minLength,
  position = "top",
}) => {
  const isBelowMin = minLength !== undefined && currentLength < minLength;
  const isMaxReached = maxLength !== undefined && currentLength === maxLength;

  return (
    <p
      slot="label"
      className={`flex items-center gap-x-2 text-body-3 font-semibold text-dark ${position === "top" && "mb-2"}`}
    >
      <span>
        {label} {required && <small className="text-xl text-primary">*</small>}
      </span>

      {maxLength && (
        <span
          className={`${isMaxReached || (currentLength > 1 && isBelowMin) ? "text-primary" : ""}`}
        >
          ({currentLength}/{maxLength})
        </span>
      )}
      {withTooltip && <ToolTip content={toolTipContent} />}
    </p>
  );
};

export default FormLabel;
