import { SlOption, SlSelect } from "@shoelace-style/shoelace/dist/react";
import { ToolTip } from "@/components/ui/tooltip";
import useDevice from "@/hooks/use-device";

type SelectProps = {
  label?: string;
  labelWithTooltip?: boolean;
  toolTipContent?: string;
  helpText?: string;
  placeholder?: string;
  options?: {
    name: string;
    value: string;
  }[];
};
const Select: React.FC<SelectProps> = ({
  label,
  toolTipContent,
  labelWithTooltip,
  helpText,
  placeholder,
  options,
}) => {
  const isMobile = useDevice();
  return (
    <SlSelect placeholder={placeholder} size={isMobile ? "medium" : "large"}>
      {label && (
        <p
          slot="label"
          className="flex text-base items-center gap-x-2 text-gray mb-1"
        >
          {label}
          {labelWithTooltip && <ToolTip content={toolTipContent}></ToolTip>}
        </p>
      )}
      {helpText && (
        <p className="mt-1 text-sm" slot="help-text">
          {helpText}
        </p>
      )}
      {options?.map((option, id) => (
        <SlOption key={`select-option-${id}`} value={option.value}>
          {option.name}
        </SlOption>
      ))}
    </SlSelect>
  );
};

export default Select;
