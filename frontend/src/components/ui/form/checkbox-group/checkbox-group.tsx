import { cn } from "@/utils";
import { SlCheckbox } from "@shoelace-style/shoelace/dist/react/index.js";
import { useEffect, useState } from "react";
import "./checkbox-group.css";

type CheckboxGroupProps = {
  options: {
    value: string;
    apiValue?: string;
  }[];
  disabled?: boolean;
  defaultSelectedOption?: string | string[];
  onCheck: (selectedOptions: string[]) => void;
  className?: string;
  multiple?: boolean;
  variant?: "primary" | "dark";
};

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  disabled,
  defaultSelectedOption,
  onCheck,
  className,
  multiple = false,
  variant = "dark",
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(defaultSelectedOption)
      ? defaultSelectedOption
      : defaultSelectedOption
        ? [defaultSelectedOption]
        : [],
  );

  useEffect(() => {
    if (defaultSelectedOption) {
      setSelectedOptions(
        Array.isArray(defaultSelectedOption)
          ? defaultSelectedOption
          : [defaultSelectedOption],
      );
    }
  }, [defaultSelectedOption]);

  const handleCheckboxChange = (value: string) => {
    let updatedOptions: string[];

    if (multiple) {
      if (selectedOptions.includes(value)) {
        updatedOptions = selectedOptions.filter((option) => option !== value);
      } else {
        updatedOptions = [...selectedOptions, value];
      }
    } else {
      updatedOptions = [value];
    }

    setSelectedOptions(updatedOptions);
    onCheck(updatedOptions);
  };

  return (
    <ul className={cn(`flex flex-col gap-y-4 text-dark ${className}`)}>
      {options.map((option, id) => (
        <li key={`checkbox-option-${id}`} className="flex items-center gap-x-2">
          <SlCheckbox
            disabled={disabled}
            size="small"
            value={option.value}
            checked={selectedOptions.includes(option.value)}
            className={variant}
            onSlChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              //@ts-expect-error bad type definition
              const selectedValue = e.target.value;
              handleCheckboxChange(selectedValue);
            }}
          ></SlCheckbox>
          <span>{option.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default CheckboxGroup;
