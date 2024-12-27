import { cn } from "@/utils";
import { SlCheckbox } from "@shoelace-style/shoelace/dist/react/index.js";
import { useEffect, useState } from "react";
import "./checkbox-group.css";
import { SHOELACE_SIZES } from "@/enums";

type CheckboxGroupProps = {
  options: {
    value: string;
    apiValue?: string | number;
  }[];
  disabled?: boolean;
  defaultSelectedOption?: string | string[] | number[];
  onCheck: (selectedOptions: (string | number)[]) => void;
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
      ? defaultSelectedOption.map(String)
      : defaultSelectedOption
        ? [String(defaultSelectedOption)]
        : [],
  );

  useEffect(() => {
    if (defaultSelectedOption) {
      setSelectedOptions(
        Array.isArray(defaultSelectedOption)
          ? defaultSelectedOption.map(String)
          : [String(defaultSelectedOption)],
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
    onCheck(
      updatedOptions.map((opt) => (isNaN(Number(opt)) ? opt : Number(opt))),
    );
  };

  return (
    <ul className={cn(`flex flex-col gap-y-4 text-dark ${className}`)}>
      {options.map((option, id) => (
        <li key={`checkbox-option-${id}`} className="flex items-center gap-x-2">
          <SlCheckbox
            disabled={disabled}
            size={SHOELACE_SIZES.SMALL}
            //@ts-expect-error bad type definition
            value={option.apiValue ?? option.value}
            checked={selectedOptions.includes(
              String(option.apiValue ?? option.value),
            )}
            className={variant}
            onSlChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              //@ts-expect-error bad type definition
              const selectedValue = String(e.target.value);
              handleCheckboxChange(selectedValue);
            }}
          >
            <span className="cursor-pointer">{option.value}</span>
          </SlCheckbox>
        </li>
      ))}
    </ul>
  );
};

export default CheckboxGroup;
