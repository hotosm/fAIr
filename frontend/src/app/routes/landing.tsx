import { FAQs } from "@/components/shared";
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

import { Head } from "@/components/seo";

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
