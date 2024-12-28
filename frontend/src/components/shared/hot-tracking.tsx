import { ENVS } from "@/config/env";
import { APPLICATION_ROUTES } from "@/constants";
import { HOT_TRACKING_HTML_TAG_NAME } from "@/constants";
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
      hotTracking.setAttribute("site-id", ENVS.MATOMO_ID);
      hotTracking.setAttribute("domain", ENVS.MATOMO_APP_DOMAIN);
      hotTracking.setAttribute("force", "true");

      // Append element to body
      document.body.appendChild(hotTracking);
    }
  }, [pathname, homepagePath]);

  return null;
};
