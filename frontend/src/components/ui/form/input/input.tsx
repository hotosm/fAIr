import { SlInput } from "@shoelace-style/shoelace/dist/react";
import styles from "./input.module.css";
import { CalenderIcon } from "@/components/ui/icons";
import useBrowserType from "@/hooks/use-browser-type";
import { useRef } from "react";
import useDevice from "@/hooks/use-device";
import { HelpText, FormLabel } from "@/components/ui/form";
import CheckIcon from "@/components/ui/icons/check-icon";

type InputProps = {
  handleInput: (arg: React.ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
  className?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  type?: "date" | "text" | "number" | "url";
  showBorder?: boolean;
  label?: string;
  size?: "small" | "medium" | "large";
  helpText?: string;
  labelWithTooltip?: boolean;
  toolTipContent?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp | string;
  validationStateUpdateCallback?: (validity: boolean) => void;
  isValid?: boolean;
  min?: number;
  max?: number;
};

const Input: React.FC<InputProps> = ({
  handleInput,
  value,
  className = "",
  placeholder = "",
  clearable = false,
  disabled = false,
  type = "text",
  showBorder = false,
  label,
  size,
  helpText,
  labelWithTooltip = false,
  toolTipContent,
  required = false,
  maxLength,
  minLength,
  pattern,
  validationStateUpdateCallback,
  isValid = false,
  min,
  max,
}) => {
  const { isChrome } = useBrowserType();

  const openNativeDatePicker = () => {
    inputRef.current?.focus();
    inputRef.current?.showPicker();
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useDevice();

  return (
    <SlInput
      onSlInput={(e) => {
        validationStateUpdateCallback &&
          validationStateUpdateCallback?.(
            // @ts-expect-error bad type definition
            {
              valid: inputRef.current?.validity?.valid,
              message: inputRef.current?.validationMessage,
            },
          );
        // @ts-expect-error bad type definition
        handleInput(e);
      }}
      // @ts-expect-error bad type definition
      value={value}
      className={`${className} ${styles.customInput} ${showBorder && styles.showBorder}`}
      placeholder={placeholder}
      clearable={clearable}
      disabled={disabled}
      type={type}
      // @ts-expect-error bad type definition
      ref={inputRef}
      label={label}
      size={size ? size : isMobile ? "medium" : "large"}
      minlength={minLength}
      maxlength={maxLength}
      pattern={`${pattern}`}
      min={min}
      max={max}
      step={1}
    >
      {label && (
        <FormLabel
          label={label as string}
          withTooltip={labelWithTooltip}
          toolTipContent={toolTipContent as string}
          required={required}
          currentLength={String(value).length}
          maxLength={maxLength}
        />
      )}

      {helpText && <HelpText content={helpText} />}
      {/* 
        We're using the native browser date picker. 
        In chrome it displays a calender icon which unfortunately could not be customized as at 08/10/2024.
        So we're using our custom calender icon in other browsers, but using the native calender in chrome.
        The other alternative to this is to install an external library for the date picker.
        This is a trade off to save some Kb in the app build size.
       
       */}
      {!isChrome && type === "date" && (
        <CalenderIcon
          className="icon text-dark cursor-pointer"
          slot="suffix"
          onClick={openNativeDatePicker}
        />
      )}

      {isValid && (
        <span
          className="icon rounded-full p-1 bg-green-primary flex items-center justify-center"
          slot="suffix"
        >
          <CheckIcon className=" text-white" />
        </span>
      )}
    </SlInput>
  );
};

export default Input;
