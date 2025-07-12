import { ABOUT_PAGE_CONTENT } from "@/constants";
import { AIIcon } from "@/assets/svgs";
import { Head } from "@/components/seo";
import { Header } from "@/components/shared";
import { HOTTeamLandscape } from "@/assets/images";
import { Image } from "@/components/ui/image";

export const AboutPage = () => {
  return (
    <main className="static-page-layout">
      <Head title={ABOUT_PAGE_CONTENT.pageTitle} />
      <Header title={ABOUT_PAGE_CONTENT.pageHeader} />
      <section className="flex flex-col items-center justify-between gap-y-20 md:flex-row">
        <div className="flex basis-1/2 flex-col gap-y-8">
          <h1 className="text-title-2 font-semibold xl:text-title-1">
            {ABOUT_PAGE_CONTENT.heroHeading.firstSegment}
            <span className="text-primary">
              {ABOUT_PAGE_CONTENT.heroHeading.secondSegment}
            </span>
            {ABOUT_PAGE_CONTENT.heroHeading.thirdSegment}
          </h1>
        </div>
      </section>
      <section>
        <Image
          alt={ABOUT_PAGE_CONTENT.imageAlt}
          src={HOTTeamLandscape}
          width="100%"
          height="100%"
          className="size-2 md:size-full"
        />
      </section>
      <section className="flex w-full flex-col-reverse items-center md:flex-row md:justify-between">
        <div className="flex basis-2/4 flex-col gap-y-4">
          <p className="text-body-2base text-dark md:text-body-2">
            {ABOUT_PAGE_CONTENT.bodyContent.firstParagraph}
          </p>
          <p>{ABOUT_PAGE_CONTENT.bodyContent.secondParagraph}</p>
        </div>
        <Image src={AIIcon} alt="AI Icon" width="300px" height="300px" />
      </section>
    </main>
  );
};
