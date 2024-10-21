import SlTooltip from "@shoelace-style/shoelace/dist/react/tooltip/index.js";
import { InfoIcon } from "@/components/ui/icons";

type ToolTipProps = {
  content: string;
};
const ToolTip: React.FC<ToolTipProps> = ({ content }) => (
  <SlTooltip onSlAfterHide={(e) => e.stopImmediatePropagation()}>
    <span slot="content">{content}</span>
    <InfoIcon className="w-4 h-4" />
  </SlTooltip>
);

export default ToolTip;
