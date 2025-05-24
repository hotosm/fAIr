import { APPLICATION_ROUTES } from "@/constants";
import {
  HOT_TRACKING_HTML_TAG_NAME,
  MATOMO_APP_DOMAIN,
  MATOMO_ID,
} from "@/config";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const HotTracking = ({ homepagePath = APPLICATION_ROUTES.HOMEPAGE }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (document.getElementsByTagName(HOT_TRACKING_HTML_TAG_NAME).length > 0)
      return;

    if (pathname === homepagePath) {
      const hotTracking = document.createElement(HOT_TRACKING_HTML_TAG_NAME);
      // CSS classname to customize it
      hotTracking.classList.add("hot-matomo");
      hotTracking.setAttribute("site-id", MATOMO_ID);
      hotTracking.setAttribute("domain", MATOMO_APP_DOMAIN);
      hotTracking.setAttribute("force", "true");

      // Append element to body
      document.body.appendChild(hotTracking);
    }
  }, [pathname, homepagePath]);

  return null;
};