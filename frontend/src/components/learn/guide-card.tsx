import { LEARN_PAGE_CONTENT } from "@/constants";
import { SHOELACE_SIZES } from "@/enums";
import { TGuide } from "@/types";
import { Button } from "../ui/button";
import { ExternalLinkIcon, YouTubePlayCircleIcon } from "../ui/icons";
import { Link } from "@/components/ui/link";

export const GuideCard = ({ guide }: { guide: TGuide }) => {
  return (
    <div className="border border-gray-border bg-white p-10 flex flex-col z-10 col-span-1 gap-y-2">
      <div className="flex justify-between">
        <div className="basis-3/4 xl:basis-2/3 flex flex-col gap-y-6">
          <h1 className="text-body-1 md:text-title-3 font-bold text-dark text-nowrap">
            {guide.title}
          </h1>
          <p className="text-body-2base md:text-body-2 text-grey">{guide.description}</p>
        </div>
        <div className="rounded-full w-12 h-12 bg-light-gray p-1 flex items-center justify-center">
          <guide.icon className="icon-lg" />
        </div>
      </div>

      <div className="self-end">
        {guide.comingSoon ? (
          <Button onClick={guide.onClick} size={SHOELACE_SIZES.MEDIUM}>
            {LEARN_PAGE_CONTENT.comingSoonText}
          </Button>
        ) : guide.isLink ? (
          <Link href={guide.href as string} nativeAnchor blank title={guide.buttonText}>
            <Button onClick={guide.onClick} size={SHOELACE_SIZES.MEDIUM}>
              {guide.buttonText}
              {guide.isLink && <ExternalLinkIcon className="icon" />}
            </Button>
          </Link>
        ) : (
          <Button onClick={guide.onClick} size={SHOELACE_SIZES.MEDIUM}>
            {guide.buttonText}
            {guide.isVideo && <YouTubePlayCircleIcon className="icon text-white" />}
          </Button>
        )}
      </div>
    </div>
  );
};
