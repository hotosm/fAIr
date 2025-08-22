import { Head } from "@/components/seo";
import {
  Header,
  Kpi,
  WhatIsFAIR,
  TheFAIRProcess,
  CoreFeatures,
  Corevalues,
} from "@/components/landing";
import { Suspense, lazy } from "react";

const FAQs = lazy(() =>
  import("@/components/shared").then((mod) => ({ default: mod.FAQs }))
);
const TaglineBanner = lazy(() =>
  import("@/components/landing").then((mod) => ({
    default: mod.TaglineBanner,
  }))
);
const CallToAction = lazy(() =>
  import("@/components/landing").then((mod) => ({ default: mod.CallToAction }))
);

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
      <Suspense fallback={null}>
        <section className="app-padding">
          <FAQs disableSeeMoreButton />
        </section>
        <TaglineBanner />
        <CallToAction />
      </Suspense>
    </>
  );
};
