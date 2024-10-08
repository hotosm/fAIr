import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import WhatIsFAIR from "@/components/landing/about-fair/about-fair";
import CoreFeatures from "@/components/landing/core-features/core-features";
import Corevalues from "@/components/landing/core-values/core-values";
import CallToAction from "@/components/landing/cta/cta";
import TheFAIRProcess from "@/components/landing/fair-process/fair-process";
import FAQs from "@/components/landing/faqs/faqs";
import Kpi from "@/components/landing/kpi/kpi";
import TaglineBanner from "@/components/landing/tagline/tagline";
import { Head } from "@/components/seo";

export const LandingPage = () => {
  return (
    <>
      <Head title="Home" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr)) max-w-[1800px] mx-auto">
        <Header />
        <Kpi />
        <WhatIsFAIR />
        <TheFAIRProcess />
        <CoreFeatures />
        <Corevalues />
        <FAQs />
        <TaglineBanner />
        <CallToAction />
        <Footer />
      </div>
    </>
  );
};
