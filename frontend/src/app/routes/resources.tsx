import { PageUnderConstruction } from '@/components/errors';
// import { ChevronDownIcon } from "@/components/ui/icons";
// import { FAQs, SectionHeader } from "@/components/shared";
// import { Head } from "@/components/seo";
// import { Header } from "@/components/shared";
// import { Image } from "@/components/ui/image";
// import { Link } from "@/components/ui/link";
// import { RESOURCES_PAGE_CONTENT } from "@/constants";
// import { TArticle } from "@/types";
// import { truncateString } from "@/utils";


export const ResourcesPage = () => {
  return (
    <PageUnderConstruction />
    // <main className="static-page-layout">
    //   <Head title={RESOURCES_PAGE_CONTENT.pageTitle} />
    //   <Header title={RESOURCES_PAGE_CONTENT.pageHeader} />
    //   <section className="flex flex-col md:flex-row gap-y-20 justify-between items-center">
    //     <div className="flex flex-col gap-y-8 basis-1/2">
    //       <h1 className="font-semibold text-title-2 xl:text-title-1">
    //         {RESOURCES_PAGE_CONTENT.hero.firstSegment}{" "}
    //         <span className="text-primary">
    //           {RESOURCES_PAGE_CONTENT.hero.secondSegment}
    //         </span>{" "}
    //         {RESOURCES_PAGE_CONTENT.hero.thirdSegment}{" "}
    //       </h1>
    //     </div>
    //   </section>
    //   <section>
    //     <FAQs faqs={RESOURCES_PAGE_CONTENT.faqs.faqs} disableSeeMoreButton />
    //   </section>
    //   <section>
    //     <SectionHeader title={RESOURCES_PAGE_CONTENT.articles.title} />
    //     <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-7 gap-y-10">
    //       {RESOURCES_PAGE_CONTENT.articles.articles.map((article, id) => (
    //         <ArticleCard article={article} key={id} />
    //       ))}
    //     </div>
    //   </section>
    // </main>
  );
};

// const ArticleCard = ({ article }: { article: TArticle }) => {
//   return (
//     <div className="flex flex-col gap-y-8">
//       <div className="relative">
//         <div className="w-full h-48 border border-gray-border">
//           <Image src={article.image} alt={article.title} className="h-full" />
//         </div>
//       </div>
//       <div className="flex flex-col gap-y-6">
//         <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
//           {truncateString(article.title, 50)}
//         </h2>
//         <p className="text-body-2base lg:text-body-2 text-gray">
//           {truncateString(article.snippet, 120)}
//         </p>
//         <Link href={article.link} blank title={article.title}>
//           <p className="text-body-2base text-primary capitalize font-semibold">
//             Read more <ChevronDownIcon className="-rotate-90 icon w-3 h-3" />
//           </p>
//         </Link>
//       </div>
//     </div>
//   );
// };
