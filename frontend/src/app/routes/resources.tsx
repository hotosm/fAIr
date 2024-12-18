import { FAQs, SectionHeader } from "@/components/shared";
import { Head } from "@/components/seo";
import { Header } from "@/components/shared";
import { resourcesPageContent } from "@/constants";
import { TArticle } from "@/types";
import { Image } from "@/components/ui/image";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { truncateString } from "@/utils";

export const ResourcesPage = () => {
  return (
    <main className="static-page-layout">
      <Head title={resourcesPageContent.pageTitle} />
      <Header title={resourcesPageContent.pageHeader} />
      <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
        <div className="flex flex-col gap-y-8 basis-1/2">
          <h1 className="font-semibold text-title-2 xl:text-title-1">
            {resourcesPageContent.hero.firstSegment}{" "}
            <span className="text-primary">
              {resourcesPageContent.hero.secondSegment}
            </span>{" "}
            {resourcesPageContent.hero.thirdSegment}{" "}
          </h1>
        </div>
      </section>
      <section>
        <FAQs faqs={resourcesPageContent.faqs.faqs} disableSeeMoreButton />
      </section>
      <section>
        <SectionHeader title={resourcesPageContent.articles.title} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-7 gap-y-10">
          {resourcesPageContent.articles.articles.map((article, id) => (
            <ArticleCard article={article} key={id} />
          ))}
        </div>
      </section>
    </main>
  );
};

const ArticleCard = ({ article }: { article: TArticle }) => {
  return (
    <div className="flex flex-col gap-y-8">
      <div className="relative">
        <div className="w-full h-48 border border-gray-border">
          <Image src={article.image} alt={article.title} className="h-full" />
        </div>
      </div>
      <div className="flex flex-col gap-y-6">
        <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
          {truncateString(article.title, 50)}
        </h2>
        <p className="text-body-2base lg:text-body-2 text-gray">
          {truncateString(article.snippet, 120)}
        </p>
        <Link href={article.link} blank title={article.title}>
          <p className="text-body-2base text-primary capitalize font-semibold">
            Read more <ChevronDownIcon className="-rotate-90 icon w-3 h-3" />
          </p>
        </Link>
      </div>
    </div>
  );
};
