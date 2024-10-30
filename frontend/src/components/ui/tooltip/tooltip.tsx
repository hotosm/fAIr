import SlTooltip from "@shoelace-style/shoelace/dist/react/tooltip/index.js";
import { InfoIcon } from "@/components/ui/icons";

type ToolTipProps = {
  content?: string;
  infoIcon?: boolean;
  children?: React.ReactNode;
};
const ToolTip: React.FC<ToolTipProps> = ({
  content,
  infoIcon = true,
  children,
}) => (
  <SlTooltip onSlAfterHide={(e) => e.stopImmediatePropagation()}>
    <span slot="content">{content}</span>
    {infoIcon && <InfoIcon className="icon" />}
    {children}
  </SlTooltip>
);

export default ToolTip;
