import { SlInput } from "@shoelace-style/shoelace/dist/react";
import styles from "./input.module.css";
import { CalenderIcon } from "@/components/ui/icons";
import useBrowserType from "@/hooks/use-browser-type";
import { useRef } from "react";
import { ToolTip } from "@/components/ui/tooltip";
import useDevice from "@/hooks/use-device";

type InputProps = {
  handleInput: (arg: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  className?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  type?: "date" | "text";
  showBorder?: boolean;
  label?: string;
  size?: "small" | "medium" | "large";
  helpText?: string;
  labelWithTooltip?: boolean;
  toolTipContent?: string;
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
}) => {
  const { isChrome } = useBrowserType();

  const openNativeDatePicker = () => {
    dateInputRef.current?.focus();
    dateInputRef.current?.showPicker();
  };

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useDevice();
  return (
    <SlInput
      // @ts-expect-error bad type definition
      onSlInput={handleInput}
      value={value}
      className={`${className} ${styles.customInput} ${showBorder && styles.showBorder}`}
      placeholder={placeholder}
      clearable={clearable}
      disabled={disabled}
      type={type}
      //@ts-expect-error bad type definition
      ref={dateInputRef}
      label={label}
      size={size ? size : isMobile ? "medium" : "large"}
    >
      {label && (
        <p
          slot="label"
          className="flex text-base items-center gap-x-2 text-gray mb-1"
        >
          {label}
          {labelWithTooltip && <ToolTip content={toolTipContent}></ToolTip>}
        </p>
      )}
      {helpText && (
        <p className="mt-1 text-sm" slot="help-text">
          {helpText}
        </p>
      )}
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
    </SlInput>
  );
};

export default Input;
