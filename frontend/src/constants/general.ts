import { APPLICATION_ROUTES, HOT_PRIVACY_POLICY_URL } from "./routes";
import { SHARED_CONTENT } from "@/constants";
import { TNavBarLinks, TFooterLinks } from "@/types";

export const navLinks: TNavBarLinks = [
  {
    title: SHARED_CONTENT.navbar.routes.exploreModels,
    href: APPLICATION_ROUTES.MODELS,
    active: true,
  },
  {
    title: SHARED_CONTENT.navbar.routes.exploreDatasets,
    href: APPLICATION_ROUTES.DATASETS,
    active: true,
    children: [
      {
        title: "Training Datasets",
        href: APPLICATION_ROUTES.DATASETS,
      },
      {
        title: "AI Predictions",
        href: APPLICATION_ROUTES.AI_PREDICTIONS,
      },
    ],
  },
  {
    title: SHARED_CONTENT.navbar.routes.learn,
    href: APPLICATION_ROUTES.LEARN_BASE,
    active: true,
  },
  {
    title: SHARED_CONTENT.navbar.routes.about,
    href: APPLICATION_ROUTES.ABOUT,
    active: true,
  },
  {
    title: SHARED_CONTENT.navbar.routes.resources,
    href: APPLICATION_ROUTES.RESOURCES,
    active: false,
  },
];

type TFooterGroupLinks = {
  groupOne: TFooterLinks;
  groupTwo: TFooterLinks;
};

export const footerLinks: TFooterGroupLinks = {
  groupOne: [
    {
      title: "explore models",
      route: APPLICATION_ROUTES.MODELS,
      active: true,
    },
    {
      title: "Training datasets",
      route: APPLICATION_ROUTES.DATASETS,
      active: true,
    },
    {
      title: "AI Predictions",
      route: APPLICATION_ROUTES.AI_PREDICTIONS,
      active: true,
    },
    {
      title: "learn",
      route: APPLICATION_ROUTES.LEARN_BASE,
      active: true,
    },
  ],
  groupTwo: [
    {
      title: "resources",
      route: APPLICATION_ROUTES.RESOURCES,
      isExternalLink: false,
      active: false,
    },
    {
      title: "privacy policy",
      route: HOT_PRIVACY_POLICY_URL,
      isExternalLink: true,
      active: true,
    },
    {
      title: "about",
      route: APPLICATION_ROUTES.ABOUT,
      active: true,
    },
  ],
};
