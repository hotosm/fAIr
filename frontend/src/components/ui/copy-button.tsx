import useCopyToClipboard from "@/hooks/use-clipboard";
import { CheckIcon, ClipboardIcon } from "@/components/ui/icons";
import { ToolTip } from "./tooltip";
import { IconProps } from "@/types";
import React from "react";

export const CopyButton = ({
  text,
  size = "large",
  label,
  tooltipContent = "Copy to clipboard",
  iconClassName = "size-6",
  icon: CustomIcon,
}: {
  text: string;
  size?: "small" | "large";
  tooltipContent?: string;
  iconClassName?: string;
  label?: string;
  icon?: React.FC<IconProps>;
}) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const iconSize = size === "small" ? "icon" : "icon md:icon-lg";
  const DefaultIcon = CustomIcon || ClipboardIcon;

  return (
    <ToolTip content={isCopied ? "Copied!" : tooltipContent}>
      <button
        type="button"
        onClick={() => copyToClipboard(text)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className="relative flex items-center justify-center">
          <DefaultIcon
            className={`absolute ${iconClassName} transition-opacity duration-300 ${iconSize} ${
              isCopied ? "opacity-0" : "opacity-100"
            }`}
          />
          <CheckIcon
            className={`absolute ${iconClassName} transition-opacity duration-300 ${iconSize} ${
              isCopied ? "opacity-100" : "opacity-0"
            }`}
          />
        </span>

        {label && (
          <span className="ml-2 text-body-4 md:text-body-3 whitespace-nowrap">{label}</span>
        )}
      </button>
    </ToolTip>
  );
};
