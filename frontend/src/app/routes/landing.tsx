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
import { BaseModelCTA } from "@/components/landing/base-model-cta/base-model-cta";

export const LandingPage = () => {
  return (
    <>
      <Head title="Home" />
      <Header />
      <Kpi />
      <WhatIsFAIR />
      <TheFAIRProcess />
      <BaseModelCTA />
      <CoreFeatures />
      <Corevalues />
      <section className="app-padding">
        <FAQs disableSeeMoreButton />
      </section>
      <TaglineBanner />
      <CallToAction />
    </>
  );
};
