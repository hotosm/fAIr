import { MapSwipeLogo } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { ToolTip } from "@/components/ui/tooltip";

export const MapSwipeProjectIsActive = ({
  MapSwipeId,
  isCard,
  onClick,
}: {
  MapSwipeId: string;
  isCard?: boolean;
  onClick?: () => void;
}) => {
  return (
    <span className="flex items-center justify-start">
      {MapSwipeId ? (
        <ToolTip
          content={"A MapSwipe project is associated with this prediction."}
        >
          {onClick ? (
            <button className="cursor-pointer" onClick={onClick}>
              <Image
                src={MapSwipeLogo}
                className="icon lg:icon-lg"
                alt="MapSwipe Icon"
              />
            </button>
          ) : (
            <Image
              src={MapSwipeLogo}
              className="icon lg:icon-lg"
              alt="MapSwipe Icon"
            />
          )}
        </ToolTip>
      ) : isCard ? null : (
        "-"
      )}
    </span>
  );
};
