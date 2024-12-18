import { Header } from "@/components/landing/header";
import WhatIsFAIR from "@/components/landing/about-fair/about-fair";
import CoreFeatures from "@/components/landing/core-features/core-features";
import Corevalues from "@/components/landing/core-values/core-values";
import CallToAction from "@/components/landing/cta/cta";
import TheFAIRProcess from "@/components/shared/fair-process/fair-process";
import { FAQs } from "@/components/shared";
import Kpi from "@/components/landing/kpi/kpi";
import TaglineBanner from "@/components/landing/tagline/tagline";
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
      <section className="px-large md:px-extra-large">
        <FAQs />
      </section>
      <TaglineBanner />
      <CallToAction />
    </>
  );
};
