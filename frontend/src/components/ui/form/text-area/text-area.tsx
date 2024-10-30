import SlTextarea from "@shoelace-style/shoelace/dist/react/textarea/index.js";
import { ToolTip } from "@/components/ui/tooltip";

type TextAreaProps = {
  toolTipContent?: string;
  labelWithTooltip?: boolean;
  helpText?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

const TextArea: React.FC<TextAreaProps> = ({
  toolTipContent,
  labelWithTooltip,
  helpText,
  label,
  placeholder,
  disabled = false,
  children,
}) => {
  return (
    <SlTextarea placeholder={placeholder} resize="none" disabled={disabled}>
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
      {children}
    </SlTextarea>
  );
};

export default TextArea;
