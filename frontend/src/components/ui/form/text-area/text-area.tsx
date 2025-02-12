import { FormLabel, HelpText } from '@/components/ui/form';
import { SlTextarea } from '@shoelace-style/shoelace/dist/react';
import './text-area.css';

type TextAreaProps = {
  toolTipContent?: string;
  labelWithTooltip?: boolean;
  helpText?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
};

const TextArea: React.FC<TextAreaProps> = ({
  toolTipContent,
  labelWithTooltip,
  helpText,
  label,
  placeholder,
  disabled = false,
  children,
  handleChange,
  value,
  required = false,
  maxLength,
  minLength,
}) => {
  return (
    <SlTextarea
      placeholder={placeholder}
      resize="none"
      disabled={disabled}
      // @ts-expect-error bad type definition
      onSlInput={handleChange}
      value={value}
      rows={10}
      minlength={minLength}
      maxlength={maxLength}
    >
      {label && (
        <FormLabel
          label={label as string}
          withTooltip={labelWithTooltip as boolean}
          toolTipContent={toolTipContent as string}
          required={required}
          currentLength={String(value).length}
          maxLength={maxLength}
          minLength={minLength}
        />
      )}

      {helpText && <HelpText content={helpText} />}
      {children}
    </SlTextarea>
  );
};

export default TextArea;
