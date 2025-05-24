import useCopyToClipboard from "@/hooks/use-clipboard";
import { CheckIcon, ClipboardIcon } from "@/components/ui/icons";
import { ToolTip } from "./tooltip";

export const CopyButton = ({
  text,
  size = "large",
  tooltipContent = "Copy to clipboard",
}: {
  text: string;
  size?: "small" | "large";
  tooltipContent?: string;
}) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const iconSize = size === "small" ? "icon" : "icon md:icon-lg";

  return (
    <ToolTip content={isCopied ? "Copied!" : tooltipContent}>
      <button
        onClick={() => copyToClipboard(text)}
        className={`relative ${iconSize} flex items-center justify-center`}
      >
        <ClipboardIcon
          className={`absolute inset-0 top-1/2 -translate-y-1/2 ${iconSize} transition-all duration-300 ${
            isCopied ? "opacity-0" : "opacity-100"
          }`}
        />
        <CheckIcon
          className={`absolute inset-0 top-1/2 -translate-y-1/2  ${iconSize} transition-all duration-300 ${
            isCopied ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
    </ToolTip>
  );
};
