import {
  SlRadioGroup,
  SlRadio,
} from "@shoelace-style/shoelace/dist/react/index.js";
import "./radio-group.css";
import { ToolTip } from "@/components/ui/tooltip";

type RadioGroupProps = {
  label?: string;
  value: string;
  options: {
    label: string;
    value: string;
    tooltip?: string;
  }[];
  onChange: (value: string) => void;
  withTooltip?: boolean;
  labelClassName?: string;
};

export const RadioGroup = ({
  label,
  value,
  options,
  onChange,
  withTooltip = false,
  labelClassName = "text-body-4",
}: RadioGroupProps) => {
  return (
    <SlRadioGroup
      label={label}
      value={value}
      // @ts-expect-error bad type definition
      onSlChange={(e) => onChange(e.target.value)}
    >
      <div className="flex flex-col space-y-4">
        {options.map((option) => (
          <SlRadio key={option.value} value={option.value}>
            <span className={labelClassName}>{option.label}</span>
            <span className="ml-1">
              {withTooltip && option.tooltip && (
                <ToolTip content={option.tooltip} />
              )}
            </span>
          </SlRadio>
        ))}
      </div>
    </SlRadioGroup>
  );
};
