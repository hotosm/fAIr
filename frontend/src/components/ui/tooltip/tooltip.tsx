import { InfoIcon } from "@/components/ui/icons";
import { ToolTipPlacement } from "@/enums";
import SlTooltip, {
  SlHideEvent,
} from "@shoelace-style/shoelace/dist/react/tooltip/index.js";
import { useEffect, useRef, useState } from "react";

type ToolTipProps = {
  content?: string | React.ReactElement | null;
  children?: React.ReactNode;
  placement?: ToolTipPlacement;
  open?: boolean;
  /** A click keeps the tooltip open until a click elsewhere or Escape. */
  pinOnClick?: boolean;
};
const ToolTip: React.FC<ToolTipProps> = ({
  content,
  children,
  placement = ToolTipPlacement.TOP,
  open,
  pinOnClick = false,
}) => {
  const [pinned, setPinned] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const unpinOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setPinned(false);
    };
    const unpinOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Captured first and cancelled so Shoelace's CloseWatcher keeps the panel open.
      event.preventDefault();
      event.stopPropagation();
      setPinned(false);
    };
    document.addEventListener("pointerdown", unpinOutside);
    window.addEventListener("keydown", unpinOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", unpinOutside);
      window.removeEventListener("keydown", unpinOnEscape, true);
    };
  }, [pinned]);

  const stopPropagations = (e: SlHideEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
  };
  if (!content) return children;
  const icon = (
    <>
      {!children && <InfoIcon className="icon" />}
      {children}
    </>
  );
  const openProps = pinOnClick
    ? { trigger: pinned ? "manual" : "hover focus", open: pinned }
    : open !== undefined
      ? { open }
      : {};
  const tooltip = (
    <SlTooltip
      onSlAfterHide={(e) => stopPropagations(e)}
      onSlAfterShow={(e) => stopPropagations(e)}
      onSlHide={(e) => stopPropagations(e)}
      onSlShow={(e) => stopPropagations(e)}
      placement={placement}
      {...openProps}
    >
      <span slot="content">
        {typeof content === "string" ? <span>{content}</span> : content}
      </span>
      {pinOnClick ? (
        <button
          type="button"
          className="inline-flex cursor-pointer"
          aria-label={typeof content === "string" ? content : undefined}
          onClick={() => setPinned((value) => !value)}
        >
          {icon}
        </button>
      ) : (
        icon
      )}
    </SlTooltip>
  );
  if (!pinOnClick) return tooltip;
  return (
    <span ref={wrapperRef} className="inline-flex">
      {tooltip}
    </span>
  );
};
export default ToolTip;
