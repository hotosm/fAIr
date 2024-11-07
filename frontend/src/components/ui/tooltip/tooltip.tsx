import SlTooltip from "@shoelace-style/shoelace/dist/react/tooltip/index.js";
import { InfoIcon } from "@/components/ui/icons";
import { ToolTipPlacement } from "@/enums";

type ToolTipProps = {
  content?: string;
  children?: React.ReactNode;
  placement?:
    | ToolTipPlacement.RIGHT
    | ToolTipPlacement.BOTTOM
    | ToolTipPlacement.TOP;
};
const ToolTip: React.FC<ToolTipProps> = ({
  content,
  children,
  placement = ToolTipPlacement.TOP,
}) => (
  <SlTooltip
    onSlAfterHide={(e) => e.stopImmediatePropagation()}
    placement={placement}
  >
    <span slot="content">{content}</span>
    {!children && <InfoIcon className="icon" />}
    {children}
  </SlTooltip>
);

export default ToolTip;
