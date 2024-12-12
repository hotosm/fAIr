import { Header } from "@/components/shared";
import { Image } from "@/components/ui/image";
import HOTTeamLandscape from "@/assets/images/hot_team_landscape.png";
import { Head } from "@/components/seo";
import { APPLICATION_CONTENTS } from "@/contents";
import AIIcon from "@/assets/svgs/fair_ai_icon.svg";


export const AboutPage = () => {
  return (
    <main className="flex flex-col gap-y-20 md:gap-y-40 mb-48">
      <Head title={APPLICATION_CONTENTS.ABOUT_PAGE.pageTitle} />
      <Header title={APPLICATION_CONTENTS.ABOUT_PAGE.pageHeader} />
      <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
        <div className="flex flex-col gap-y-8 basis-1/2">
          <h1 className="font-semibold text-title-2 xl:text-title-1">
            {APPLICATION_CONTENTS.ABOUT_PAGE.heroHeading.firstSegment}{" "}
            <span className="text-primary">
              {APPLICATION_CONTENTS.ABOUT_PAGE.heroHeading.secondSegment}
            </span>{" "}
            {APPLICATION_CONTENTS.ABOUT_PAGE.heroHeading.thirdSegment}{" "}
          </h1>
        </div>
      </section>
      <section>
        <Image alt={APPLICATION_CONTENTS.ABOUT_PAGE.imageAlt} src={HOTTeamLandscape} width="100%" height="100%" />
      </section>

      <section className="flex flex-col-reverse md:flex-row items-center md:justify-between w-full">
        <div className="basis-2/4 flex gap-y-4 flex-col">
          <p className="text-body-2base md:text-body-2 text-dark">{APPLICATION_CONTENTS.ABOUT_PAGE.content.firstParagraph}</p>
          <p>{APPLICATION_CONTENTS.ABOUT_PAGE.content.secondParagraph}</p>
        </div>
        <Image src={AIIcon} alt="AI Icon" width="300px" height="300px" />
      </section>
    </main>
  );
};


