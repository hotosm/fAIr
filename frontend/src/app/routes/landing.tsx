import { FAQs } from "@/components/shared";
import { Head } from "@/components/seo";
import {
  Header,
  Kpi,
  TaglineBanner,
  TheFAIRProcess,
  CallToAction,
  Corevalues,
  CoreFeatures,
  WhatIsFAIR,
} from "@/components/landing";

export const LandingPage = () => {
  return (
    <>
      <Head title="Home" />
      <Header />
      <Kpi />
      <WhatIsFAIR />
      <TheFAIRProcess />
      <CoreFeatures />
      <Corevalues />
      <section className="app-padding">
        <FAQs />
      </section>
      <TaglineBanner />
      <CallToAction />
    </>
  );
};
