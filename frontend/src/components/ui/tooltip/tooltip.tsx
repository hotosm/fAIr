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
  open?: boolean;
};
const ToolTip: React.FC<ToolTipProps> = ({
  content,
  children,
  placement = ToolTipPlacement.TOP,
  open,
}) => (
  <SlTooltip
    onSlHide={(e) => e.stopPropagation()}
    onSlShow={(e) => e.stopPropagation()}
    placement={placement}
    {...(open !== undefined ? { open } : {})}
  >
    <span slot="content">{content}</span>
    {!children && <InfoIcon className="icon" />}
    {children}
  </SlTooltip>
);

export default ToolTip;
