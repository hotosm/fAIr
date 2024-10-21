import { SlCheckbox } from "@shoelace-style/shoelace/dist/react/index.js";
import { useEffect, useState } from "react";

type CheckbocGroupProps = {
  options: {
    value: string;
    apiValue?: string;
  }[];
  disabled?: boolean;
  defaultSelectedOption?: string;
  onCheck: (selectedOption: string) => void;
};

const CheckboxGroup: React.FC<CheckbocGroupProps> = ({
  options,
  disabled,
  defaultSelectedOption,
  onCheck,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    if (defaultSelectedOption) {
      setSelectedOption(defaultSelectedOption);
    }
  }, [defaultSelectedOption]);

  return (
    <ul className="flex flex-col gap-y-4 text-dark">
      {options.map((option, id) => (
        <li key={`checkbox-option-${id}`} className="flex items-center gap-x-2">
          <SlCheckbox
            disabled={disabled}
            size="small"
            value={option.value}
            checked={option.value === selectedOption}
            onSlChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              //@ts-expect-error bad type definition
              const selectedValue = e.target.value;
              onCheck(selectedValue);
              setSelectedOption(selectedValue);
            }}
          ></SlCheckbox>
          <span>{option.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default CheckboxGroup;
