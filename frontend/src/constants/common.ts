import { TNavBarLinks } from "@/types";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";

export const navLinks: TNavBarLinks = [
  {
    title: APP_CONTENT.navbar.routes.exploreModels,
    href: APPLICATION_ROUTES.MODELS,
  },
  {
    title: APP_CONTENT.navbar.routes.learn,
    href: APPLICATION_ROUTES.LEARN,
  },
  {
    title: APP_CONTENT.navbar.routes.about,
    href: APPLICATION_ROUTES.ABOUT,
  },
  {
    title: APP_CONTENT.navbar.routes.resources,
    href: APPLICATION_ROUTES.RESOURCES,
  },
];
