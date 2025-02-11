import useScreenSize from '@/hooks/use-screen-size';
import { FormLabel, HelpText } from '@/components/ui/form';
import { SHOELACE_SELECT_SIZES } from '@/enums';
import { SlOption, SlSelect } from '@shoelace-style/shoelace/dist/react';
import { TShoelaceSize } from '@/types';
import './select.css';

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
  handleChange: (value: number | string) => void;
  required?: boolean;
  size?: TShoelaceSize | undefined;
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

  const getSize = (): TShoelaceSize => {
    if (size) return size;
    return isMobile
      ? SHOELACE_SELECT_SIZES.MEDIUM
      : SHOELACE_SELECT_SIZES.LARGE;
  };

  return (
    <SlSelect
      placeholder={placeholder}
      size={getSize()}
      value={String(defaultValue)}
      onSlChange={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        const target = e.target as HTMLSelectElement | null;
        if (target) {
          handleChange(target.value);
        }
      }}
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
        <SlOption key={`select-option-${id}`} value={option.value as string}>
          <span className="text-body-3 font-semibold">{option.name}</span>
          <span slot="suffix" className="text-body-4 md:text-body-3">
            {option.suffix}
          </span>
        </SlOption>
      ))}
    </SlSelect>
  );
};

export default Select;
