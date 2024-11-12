import { SlOption, SlSelect } from "@shoelace-style/shoelace/dist/react";
import useScreenSize from "@/hooks/use-screen-size";
import { HelpText, FormLabel } from "@/components/ui/form";
import "./select.css";

type SelectProps = {
  label?: string;
  labelWithTooltip?: boolean;
  toolTipContent?: string;
  helpText?: string;
  placeholder?: string;
  options?: {
    name: string;
    value: string;
    suffix?: string
  }[];
  defaultValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

const Select: React.FC<SelectProps> = ({
  label,
  toolTipContent,
  labelWithTooltip,
  helpText,
  placeholder,
  options,
  defaultValue,
  handleChange,
  required,
}) => {
  const { isMobile } = useScreenSize();;
  return (
    <SlSelect
      placeholder={placeholder}
      size={isMobile ? "medium" : "large"}
      value={defaultValue}
      //@ts-expect-error bad type definition
      onSlChange={handleChange}
    >
      {label && (
        <FormLabel
          label={label as string}
          withTooltip={labelWithTooltip as boolean}
          toolTipContent={toolTipContent as string}
          required={required}
        />
      )}
      {helpText && <HelpText content={helpText} />}
      {options?.map((option, id) => (
        <SlOption key={`select-option-${id}`} value={option.value} className="flex flex-col gap-y-1">
          <span>{option.name}</span>
          <small slot="suffix">{option.suffix}</small>
        </SlOption>
      ))}
    </SlSelect>
  );
};

export default Select;
