import { TFairVideo } from "@/types";
import { getYouTubeThumbnail, formatUpdateDate } from "@/utils";
import { YouTubePlayCircleIcon } from "../ui/icons";
import { Image } from "../ui/image";

export const UpdateCard = ({
  update,
  onClick,
}: {
  update: TFairVideo;
  onClick?: () => void;
}) => {
  const thumbnailUrl = getYouTubeThumbnail(update.url);
  const formattedDate = formatUpdateDate(update.date);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="update-card cursor-pointer relative overflow-hidden group"
    >
      <Image
        src={thumbnailUrl}
        title={update.name}
        width="100%"
        alt={update.name}
        height="100%"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* YouTube Play Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/30 rounded-full p-2 transition-transform group-hover:scale-110">
          <YouTubePlayCircleIcon className="w-12 h-12 md:w-16 md:h-16 text-red-600 drop-shadow-lg" />
        </div>
      </div>
      <div className="absolute flex-col bottom-0 left-0 right-0 h-[120px] md:h-[165px] bg-gradient-to-b from-[rgba(44,48,56,0)] to-[#2C3038] backdrop-blur-[2px] p-3 md:p-4 flex justify-end gap-y-2">
        <h2 className="text-body-2 md:text-body-1 lg:text-title-3 font-bold text-white line-clamp-2">
          {update.name}
        </h2>
        <p className="text-sm text-white ">{formattedDate}</p>
      </div>
    </div>
  );
};