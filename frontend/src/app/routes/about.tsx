import { ABOUT_PAGE_CONTENT } from '@/constants';
import { AIIcon } from '@/assets/svgs';
import { Head } from '@/components/seo';
import { Header } from '@/components/shared';
import { HOTTeamLandscape } from '@/assets/images';
import { Image } from '@/components/ui/image';

export const AboutPage = () => {
  return (
    <main className="static-page-layout">
      <Head title={ABOUT_PAGE_CONTENT.pageTitle} />
      <Header title={ABOUT_PAGE_CONTENT.pageHeader} />
      <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
        <div className="flex flex-col gap-y-8 basis-1/2">
          <h1 className="font-semibold text-title-2 xl:text-title-1">
            {ABOUT_PAGE_CONTENT.heroHeading.firstSegment}{" "}
            <span className="text-primary">
              {ABOUT_PAGE_CONTENT.heroHeading.secondSegment}
            </span>{" "}
            {ABOUT_PAGE_CONTENT.heroHeading.thirdSegment}{" "}
          </h1>
        </div>
      </section>
      <section>
        <Image
          alt={ABOUT_PAGE_CONTENT.imageAlt}
          src={HOTTeamLandscape}
          width="100%"
          height="100%"
        />
      </section>
      <section className="flex flex-col-reverse md:flex-row items-center md:justify-between w-full">
        <div className="basis-2/4 flex gap-y-4 flex-col">
          <p className="text-body-2base md:text-body-2 text-dark">
            {ABOUT_PAGE_CONTENT.bodyContent.firstParagraph}
          </p>
          <p>{ABOUT_PAGE_CONTENT.bodyContent.secondParagraph}</p>
        </div>
        <Image src={AIIcon} alt="AI Icon" width="300px" height="300px" />
      </section>
    </main>
  );
};
