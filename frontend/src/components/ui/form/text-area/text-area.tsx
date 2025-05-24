import { FormLabel, HelpText } from "@/components/ui/form";
import { SlTextarea } from "@shoelace-style/shoelace/dist/react";
import styles from "./text-area.module.css";
import { useRef } from "react";

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
  validationStateUpdateCallback?: (validity: {
    valid: boolean;
    message: string;
  }) => void;
  isValid?: boolean;
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
  validationStateUpdateCallback,
  isValid = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <SlTextarea
      className={`${styles.default} ${isValid === false ? styles.invalidInput : ""}`}
      placeholder={placeholder}
      resize="none"
      disabled={disabled}
      onSlInput={(e) => {
        validationStateUpdateCallback &&
          validationStateUpdateCallback?.({
            valid: inputRef.current?.validity?.valid as boolean,
            message: inputRef.current?.validationMessage as string,
          });

        // @ts-expect-error bad type definition
        handleChange(e);
      }}
      value={value}
      rows={10}
      minlength={minLength}
      maxlength={maxLength}
      // @ts-expect-error bad type definition
      ref={inputRef}
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

      {helpText && (
        <HelpText
          content={helpText}
          isValid={isValid}
          currentLength={String(value).length}
        />
      )}
      {children}
    </SlTextarea>
  );
};

export default TextArea;
