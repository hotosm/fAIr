import { APPLICATION_ROUTES } from "@/constants";
import { MATOMO_APP_DOMAIN, MATOMO_ID } from "@/config";

declare global {
  interface Window {
    _paq: any[];
  }
}

import { useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useLocalStorage } from "@/hooks/use-storage";
import { useState } from "react";

// Adapted from - https://github.com/hotosm/ui/blob/main/src/components/tracking/tracking.component.ts
// Last accessed - 2025/26/02

export const HotTracking = ({ homepagePath = APPLICATION_ROUTES.HOMEPAGE }) => {
  const { pathname } = useLocation();
  const { setValue, getValue } = useLocalStorage();
  const storageKey = `${MATOMO_ID}-consent-agree`;
  const [showConsent, setShowConsent] = useState(
    getValue(storageKey) === undefined,
  );

  const injectMatomoScript = () => {
    //  Close and halt execution if wrong domain
    if (window.location.hostname !== MATOMO_APP_DOMAIN) {
      console.warn(
        `Matomo init failed. ${window.location.hostname} does not match ${MATOMO_APP_DOMAIN}.`,
      );
      return;
    }
    // Close and halt execution if siteId or domain not set
    if (MATOMO_ID.length === 0 || MATOMO_APP_DOMAIN.length === 0) {
      console.warn("Matomo init failed. No site id or domains provided.");
      return;
    }

    console.log(
      `Setting Matomo tracking for site=${MATOMO_ID} domain=${MATOMO_APP_DOMAIN}`,
    );

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const _paq = (window._paq = window._paq || []);

    // tracker methods like "setCustomDimension" should be called before "trackPageView"
    _paq.push(["requireConsent"]);
    _paq.push(["setDomains", [MATOMO_APP_DOMAIN]]);
    _paq.push(["trackPageView"]);
    _paq.push(["enableLinkTracking"]); // Tracks downloads
    _paq.push(["trackVisibleContentImpressions"]); // Tracks content

    (function (matomoURL) {
      _paq.push(["setTrackerUrl", `${matomoURL}/matomo.php`]);
      _paq.push(["setSiteId", MATOMO_ID]);

      const d = document;
      const g = d.createElement("script");
      const s = d.getElementsByTagName("script")[0];

      if (s?.parentNode != null) {
        g.async = true;
        g.src = `${matomoURL}/matomo.js`;
        s.parentNode.insertBefore(g, s);
      } else {
        console.warn("Script insertion failed. Parent node is null.");
      }
    })("https://matomo.hotosm.org");
  };

  const handleAgree = () => {
    if (pathname !== homepagePath) return;
    injectMatomoScript();
    setValue(storageKey, "true");
    setShowConsent(false);
  };

  const handleDisagree = () => {
    if (pathname !== homepagePath) return;
    injectMatomoScript();
    setValue(storageKey, "false");
    setShowConsent(false);
  };

  if (typeof window === "undefined") {
    return null;
  }

  if (!showConsent) return null;
  return (
    <div className="fixed bottom-0 w-screen z-[100000000000]">
      <div className="bg-[#2C3038] p-4 md:p-6 text-white text-center flex flex-col gap-y-6 items-center">
        <h1 className=" font-semibold text-title-4 md:text-title-3">
          About the information we collect
        </h1>
        <p className="font-normal text-body-3">
          We use cookies and similar technologies to recognize and analyze your
          visits, and measure traffic usage and activity. You can learn about
          how we use the data about your visit or information you provide
          reading our privacy policy. By clicking "I Agree", you consent to the
          use of cookies.
        </p>
        <div className="flex flex-col md:flex-row items-center gap-6 w-fit">
          <Button onClick={handleAgree}>I Agree</Button>
          <Button onClick={handleDisagree}>I Do Not Agree</Button>
        </div>
      </div>
    </div>
  );
};
