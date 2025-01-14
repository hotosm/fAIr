import styles from "./input.module.css";
import useBrowserType from "@/hooks/use-browser-type";
import useScreenSize from "@/hooks/use-screen-size";
import { CalenderIcon } from "@/components/ui/icons";
import { CheckIcon } from "@/components/ui/icons";
import { FormLabel, HelpText } from "@/components/ui/form";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import { SlInput } from "@shoelace-style/shoelace/dist/react";
import { useRef } from "react";

type InputProps = {
  handleInput: (arg: React.ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
  className?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  type?: INPUT_TYPES;
  showBorder?: boolean;
  label?: string;
  size?: SHOELACE_SIZES | undefined;
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
  step?: number;
};

const Input: React.FC<InputProps> = ({
  handleInput,
  value,
  className = "",
  placeholder = "",
  clearable = false,
  disabled = false,
  type = INPUT_TYPES.TEXT,
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
  step = 1,
}) => {
  const { isChrome } = useBrowserType();

  const openNativeDatePicker = () => {
    inputRef.current?.focus();
    inputRef.current?.showPicker();
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { isMobile } = useScreenSize();

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
      // @ts-expect-error bad type definition
      size={
        size ? size : isMobile ? SHOELACE_SIZES.MEDIUM : SHOELACE_SIZES.LARGE
      }
      minlength={minLength}
      maxlength={maxLength}
      // @ts-expect-error bad type definition
      pattern={pattern}
      min={min}
      max={max}
      step={step}
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
