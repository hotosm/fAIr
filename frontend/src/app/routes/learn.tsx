import { TheFAIRProcess } from "@/components/landing";
import { Header } from "@/components/shared";
import { Image } from "@/components/ui/image";
import fAIrValues from "@/assets/svgs/fair_values.svg";
import { ExternalLinkIcon, YouTubePlayCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { SHOELACE_SIZES } from "@/enums";
import { Head } from "@/components/seo";
import { IconProps } from "@/types";
import { useState } from "react";
import VideoPlaceholderImage from "@/assets/images/header_bg.jpg";
import { APPLICATION_CONTENTS } from "@/contents";

type TGuide = {
  title: string;
  description: string;
  icon: React.FC<IconProps>;
  isLink?: boolean;
  href?: string;
  isVideo?: boolean;
  onClick?: () => void;
  buttonText: string;
};

type TVideo = {
  title: string;
  description: string;
  link: string;
};

export const LearnPage = () => {
  return (
    <main className="flex flex-col gap-y-20 md:gap-y-40 mb-48">
      <Head title={APPLICATION_CONTENTS.LEARN_PAGE.pageTitle} />
      <Header title={APPLICATION_CONTENTS.LEARN_PAGE.pageHeader} />
      <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
        <div className="flex flex-col gap-y-8 basis-1/2">
          <h1 className="font-semibold text-title-2 xl:text-title-1">
            {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.firstSegment}{" "}
            <span className="text-primary">
              {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.secondSegment}
            </span>{" "}
            {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.thirdSegment}{" "}
            <span className="text-primary">
              {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.fourthSegment}
            </span>{" "}
            {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.fifthSegment}{" "}
            <span className="text-primary">
              {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.sixthSegment}
            </span>{" "}
            {APPLICATION_CONTENTS.LEARN_PAGE.heroHeading.seventhSegment}
          </h1>
          <p className="text-body-2base md:text-body-2">
            {APPLICATION_CONTENTS.LEARN_PAGE.heroDescription}
          </p>
        </div>
        <div className="w-[284px] h-[203px] md:w-[401px] md:h-[286px]">
          <Image
            src={fAIrValues}
            alt="fAIr Values"
            width="100%"
            height="100%"
          />
        </div>
      </section>
      <TheFAIRProcess disableStyle />
      <section>
        <SectionHeader
          title={APPLICATION_CONTENTS.LEARN_PAGE.sectionHeaders.guides}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-16 relative mb-10">
          {APPLICATION_CONTENTS.LEARN_PAGE.guides.map((guide, id) => (
            <GuideCard guide={guide} key={id} />
          ))}
          <div className="absolute inset-0 bg-light-gray h-full w-full top-12 left-4 md:left-8"></div>
        </div>
      </section>
      <section>
        <SectionHeader
          title={APPLICATION_CONTENTS.LEARN_PAGE.sectionHeaders.videos}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-y-20 md:gap-x-6">
          {APPLICATION_CONTENTS.LEARN_PAGE.videos.map((video, id) => (
            <VideoCard video={video} key={id} />
          ))}
        </div>
      </section>
    </main>
  );
};

const SectionHeader = ({ title }: { title: string }) => {
  return (
    <h2 className="text-title-2 lg:text-title-1 font-semibold mb-12">
      {title}
    </h2>
  );
};

const GuideCard = ({ guide }: { guide: TGuide }) => {
  return (
    <div className="border border-gray-border bg-white p-10 flex flex-col z-10 col-span-1 gap-y-2">
      <div className="flex justify-between">
        <div className="basis-3/4 xl:basis-2/3 flex flex-col gap-y-6">
          <h1 className="text-body-1 md:text-title-3 font-bold text-dark text-nowrap">
            {guide.title}
          </h1>
          <p className="text-body-2base md:text-body-2 text-gray">
            {guide.description}
          </p>
        </div>
        <div className="rounded-full w-12 h-12 bg-light-gray p-1 flex items-center justify-center">
          <guide.icon className="icon-lg" />
        </div>
      </div>
      <div className="self-end">
        {guide.isLink ? (
          <Link
            href={guide.href as string}
            nativeAnchor
            blank
            title={guide.buttonText}
          >
            <Button onClick={guide.onClick} size={SHOELACE_SIZES.MEDIUM}>
              {guide.buttonText}
              {guide.isLink && <ExternalLinkIcon className="icon" />}
            </Button>
          </Link>
        ) : (
          <Button onClick={guide.onClick} size={SHOELACE_SIZES.MEDIUM}>
            {guide.buttonText}
            {guide.isVideo && (
              <YouTubePlayCircleIcon className="icon text-white" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const VideoCard = ({ video }: { video: TVideo }) => {
  const [playVideo, setPlayVideo] = useState(false);
  return (
    <div className="col-span-2 flex flex-col gap-y-8">
      <div className="relative">
        <div className="w-full h-full">
          <Image
            src={VideoPlaceholderImage}
            width="100%"
            height="100%"
            alt={video.title}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {!playVideo ? (
            <button className="rounded-full" onClick={() => setPlayVideo(true)}>
              <YouTubePlayCircleIcon className="w-20" />
            </button>
          ) : (
            <iframe
              title={video.title}
              className="w-full h-full aspect-video"
              src={video.link}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-y-6 max-w-[85%]">
        <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
          {video.title}
        </h2>
        <p className="text-body-2base lg:text-body-2 text-gray">
          {video.description}
        </p>
      </div>
    </div>
  );
};
