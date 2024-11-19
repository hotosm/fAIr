import { SlOption, SlSelect } from "@shoelace-style/shoelace/dist/react";
import useScreenSize from "@/hooks/use-screen-size";
import { HelpText, FormLabel } from "@/components/ui/form";
import "./select.css";
import { SHOELACE_SIZES } from "@/enums";

type SelectProps = {
  label?: string;
  labelWithTooltip?: boolean;
  toolTipContent?: string;
  helpText?: string;
  placeholder?: string;
  options?: {
    name: string;
    value: string | number;
    suffix?: string;
  }[];
  defaultValue: string | number;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  size?: SHOELACE_SIZES | undefined;
  className?: string;
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
  size = undefined,
  className = "",
}) => {
  const { isMobile } = useScreenSize();
  return (
    <SlSelect
      placeholder={placeholder}
      //@ts-expect-error bad type definition
      size={
        size !== undefined
          ? size
          : isMobile
            ? SHOELACE_SIZES.MEDIUM
            : SHOELACE_SIZES.LARGE
      }
      value={String(defaultValue)}
      //@ts-expect-error bad type definition
      onSlChange={handleChange}
      className={className}
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
        <SlOption
          key={`select-option-${id}`}
          value={option.value as string}
          className="flex flex-col gap-y-1"
        >
          <span>{option.name}</span>
          <small slot="suffix">{option.suffix}</small>
        </SlOption>
      ))}
    </SlSelect>
  );
};

export default Select;
