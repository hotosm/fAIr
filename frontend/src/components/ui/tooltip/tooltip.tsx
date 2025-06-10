import { InfoIcon } from "@/components/ui/icons";
import { ToolTipPlacement } from "@/enums";
import  {
  Tooltip as SlTooltip,
} from "@hotosm/ui/components/react/index";

type ToolTipProps = {
  content?: string | React.ReactElement | null;
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
}) => {
  const stopPropagations = (e: CustomEvent<Record<PropertyKey, never>>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
  };
  if (!content) return children;
  return (
    <SlTooltip
      onSlAfterHide={(e) => stopPropagations(e)}
      onSlAfterShow={(e) => stopPropagations(e)}
      onSlHide={(e) => stopPropagations(e)}
      onSlShow={(e) => stopPropagations(e)}
      placement={placement}
      {...(open !== undefined ? { open } : {})}
    >
      <span slot="content">
        {typeof content === "string" ? <span>{content}</span> : content}
      </span>
      {!children && <InfoIcon className="icon" />}
      {children}
    </SlTooltip>
  );
};
export default ToolTip;
