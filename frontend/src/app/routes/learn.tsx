import { fAIrValues } from "@/assets/svgs";
import { Head } from "@/components/seo";
import { Header, SectionHeader } from "@/components/shared";
import { Image } from "@/components/ui/image";
import { LEARN_PAGE_CONTENT } from "@/constants";
import { TFairVideo } from "@/types";
import { useFairUpdates } from "@/hooks/use-get-fair-updates";
import {
  SlCarousel,
  SlCarouselItem,
} from "@shoelace-style/shoelace/dist/react";
import { useBreakpoint, getSlidesPerPage } from "@/hooks/use-break-point";
import { useState } from "react";
import { UpdateCardSkeleton } from "@/components/learn/update-card-skeleton";
import { VideoPlayerModal } from "@/components/learn/update-video-player";
import { UpdateCard } from "@/components/learn/update-card";
import { CourseCard } from "@/components/learn/learn-course-card";
import { GuideCard } from "@/components/learn/guide-card";
export const LearnPage = () => {
  const { data, isLoading } = useFairUpdates();
  const { breakpoint } = useBreakpoint();
  const slidesPerPage = getSlidesPerPage(breakpoint);
  const [selectedVideo, setSelectedVideo] = useState<TFairVideo | null>(null);

  const handleVideoSelect = (video: TFairVideo) => {
    setSelectedVideo(video);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
  };

  console.log(data)
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
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <SlCarouselItem
                    key={index}
                    aria-label={`Loading slide ${index + 1}`}
                    aria-roledescription="slide"
                  >
                    <UpdateCardSkeleton />
                  </SlCarouselItem>
                ))
              : data?.videos.map((update, index) => (
                  <SlCarouselItem
                    key={update.id}
                    aria-label={`Slide ${index + 1} of ${data?.videos.length}: ${update.name}`}
                    aria-roledescription="slide"
                  >
                    <UpdateCard
                      update={update}
                      onClick={() => handleVideoSelect(update)}
                    />
                  </SlCarouselItem>
                ))}
          </SlCarousel>
        </div>
      </section>
      <section>
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.courses} />
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-y-20 md:gap-x-6">
          {LEARN_PAGE_CONTENT.courses.map((course, id) => (
            <CourseCard course={course} key={id} />
          ))}
        </div>
      </section>
      <UpdateCardSkeleton />

      <section>
        <SectionHeader title={LEARN_PAGE_CONTENT.sectionHeaders.guides} />
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-16 relative mb-10">
          {LEARN_PAGE_CONTENT.guides.map((guide, id) => (
            <GuideCard guide={guide} key={id} />
          ))}
          <div className="absolute inset-0 bg-light-gray h-full w-full top-12 left-4 md:left-8"></div>
        </div>
      </section>

      <VideoPlayerModal
        video={
          selectedVideo || { id: 0, name: "", url: "", slug: "", date: "" }
        }
        onClose={handleCloseModal}
        isOpen={!!selectedVideo}
      />
    </main>
  );
};
