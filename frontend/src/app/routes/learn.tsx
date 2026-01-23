// import { PageUnderConstruction } from "@/components/errors";
import { Button } from "@/components/ui/button";
import {
  ExternalLinkIcon,
  // TimerIcon,
  YouTubePlayCircleIcon,
} from "@/components/ui/icons";
import { fAIrValues } from "@/assets/svgs";
import { Head } from "@/components/seo";
import { Header, SectionHeader } from "@/components/shared";
import { Image } from "@/components/ui/image";
// import { JumbotronBackgroundImage } from "@/assets/images";
import { LEARN_PAGE_CONTENT } from "@/constants";
import { Link } from "@/components/ui/link";
import { SHOELACE_SIZES } from "@/enums";
import { TCourse, TFairVideo, TGuide } from "@/types";
// import { TheFAIRProcess } from "@/components/landing";
// import { useState } from "react";
import ContentIcon from "@/components/ui/icons/content-icon";
import { GlobeIcon } from "@/components/ui/icons/globe-icon";
import { DurationIcon } from "@/components/ui/icons/duration-icon";
import { useFairUpdates } from "@/hooks/use-get-fair-updates";
import { getYouTubeThumbnail } from "@/utils";
import {
  SlCarousel,
  SlCarouselItem,
} from "@shoelace-style/shoelace/dist/react";
import { useBreakpoint, getSlidesPerPage } from "@/hooks/use-break-point";
export const LearnPage = () => {
  const { data } = useFairUpdates();
  const { breakpoint } = useBreakpoint();
  const slidesPerPage = getSlidesPerPage(breakpoint);
  console.log(data);

  return (
    // <PageUnderConstruction />
    <main className="static-page-layout">
      <Head title={LEARN_PAGE_CONTENT.pageTitle} />
      <Header title={LEARN_PAGE_CONTENT.pageHeader} />
      <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
        <div className="flex flex-col gap-y-8 basis-1/2">
          <h1 className="font-semibold text-title-2 xl:text-title-1">
            {LEARN_PAGE_CONTENT.heroHeading.firstSegment}{" "}
            <span className="text-primary">
              {LEARN_PAGE_CONTENT.heroHeading.secondSegment}
            </span>{" "}
            {LEARN_PAGE_CONTENT.heroHeading.thirdSegment}{" "}
            <span className="text-primary">
              {LEARN_PAGE_CONTENT.heroHeading.fourthSegment}
            </span>{" "}
            {LEARN_PAGE_CONTENT.heroHeading.fifthSegment}{" "}
            <span className="text-primary">
              {LEARN_PAGE_CONTENT.heroHeading.sixthSegment}
            </span>{" "}
            {LEARN_PAGE_CONTENT.heroHeading.seventhSegment}
          </h1>
          <p className="text-body-2base md:text-body-2">
            {LEARN_PAGE_CONTENT.heroDescription}
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

      <section
        aria-labelledby="updates-section-header"
        className="overflow-visible"
      >
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.updates} />
        <div
          className="relative updates-carousel-container"
          role="region"
          aria-roledescription="carousel"
          aria-label="fAIr Updates Videos"
        >
          <SlCarousel
            navigation
            slidesPerPage={slidesPerPage}
            slidesPerMove={1}
            className="updates-carousel"
            style={
              {
                "--slide-gap": "1rem",
                "--aspect-ratio": "auto",
              } as React.CSSProperties
            }
          >
            {data?.videos.map((update, index) => (
              <SlCarouselItem
                key={update.id}
                aria-label={`Slide ${index + 1} of ${data?.videos.length}: ${update.name}`}
                aria-roledescription="slide"
              >
                <UpdateCard update={update} />
              </SlCarouselItem>
            ))}
          </SlCarousel>
        </div>
      </section>
      {/* <TheFAIRProcess disableStyle /> */}
      <section>
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.courses} />
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-y-20 md:gap-x-6">
          {LEARN_PAGE_CONTENT.courses.map((course, id) => (
            <CourseCard course={course} key={id} />
          ))}
        </div>
      </section>
      {/* <section>
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.videos} />
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-y-20 md:gap-x-6">
          {LEARN_PAGE_CONTENT.videos.map((video, id) => (
            <VideoCard video={video} key={id} />
          ))}
        </div>
      </section> */}

      <section>
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.guides} />
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-16 relative mb-10">
          {LEARN_PAGE_CONTENT.guides.map((guide, id) => (
            <GuideCard guide={guide} key={id} />
          ))}
          <div className="absolute inset-0 bg-light-gray h-full w-full top-12 left-4 md:left-8"></div>
        </div>
      </section>
    </main>
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
          <p className="text-body-2base md:text-body-2 text-grey">
            {guide.description}
          </p>
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

// const VideoCard = ({ video }: { video: TVideo }) => {
//   const [playVideo, setPlayVideo] = useState(false);
//   return (
//     <div className="col-span-2 flex flex-col gap-y-8">
//       <div className="relative">
//         <div className="w-full h-full">
//           <Image
//             src={JumbotronBackgroundImage}
//             width="100%"
//             height="100%"
//             alt={video.title}
//           />
//         </div>
//         <div className="absolute inset-0 flex items-center justify-center">
//           {!playVideo ? (
//             <button className="rounded-full" onClick={() => setPlayVideo(true)}>
//               <YouTubePlayCircleIcon className="w-20" />
//             </button>
//           ) : (
//             <iframe
//               title={video.title}
//               className="w-full h-full aspect-video"
//               src={video.link}
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//               referrerPolicy="strict-origin-when-cross-origin"
//               allowFullScreen
//             ></iframe>
//           )}
//         </div>
//       </div>
//       <div className="flex flex-col gap-y-6 max-w-[85%]">
//         <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
//           {video.title}
//         </h2>
//         <p className="text-body-2base lg:text-body-2 text-grey">
//           {video.description}
//         </p>
//       </div>
//     </div>
//   );
// };

const CourseCard = ({ course }: { course: TCourse }) => {
  return (
    <div className="col-span-2 p-3 border border-light-gray rounded-[2px] flex relative space-y-6 flex-col">
      <div className="w-full relative  h-full">
        <div className="bg-[#2C3038] opacity-[12%] absolute top-0 bottom-0 left-0 right-0" />
        <Image
          src={course.courseImage}
          alt={course.title}
          className="w-full h-full"
        />
      </div>

      {!course.available && (
        <div className=" bg-primary px-4 rounded-3xl py-2 top-0 text-white right-4 absolute">
          <span className="text-white font-semibold">
            {LEARN_PAGE_CONTENT.comingSoonText}
          </span>
        </div>
      )}
      <div>
        <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
          {course.title}
        </h2>
      </div>

      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-2">
          <ContentIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.courseLength}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlobeIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.language}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DurationIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.duration}
          </p>
        </div>
      </div>
    </div>
  );
};

const UpdateCard = ({ update }: { update: TFairVideo }) => {
  const thumbnailUrl = getYouTubeThumbnail(update.url);

  return (
    <div className="update-card cursor-pointer relative overflow-hidden group">
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
      <div className="absolute bottom-0 left-0 right-0 h-[120px] md:h-[165px] bg-gradient-to-b from-[rgba(44,48,56,0)] to-[#2C3038] backdrop-blur-[2px] p-3 md:p-4 flex items-end">
        <h2 className="text-body-2 md:text-body-1 lg:text-title-3 font-bold text-white line-clamp-2">
          {update.name}
        </h2>
      </div>
    </div>
  );
};
