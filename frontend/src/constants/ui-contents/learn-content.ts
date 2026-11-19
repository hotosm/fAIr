import {
  AdvancedCourseImage,
  BeginnerCourseImage,
  IntermediateCourseImage,
} from "@/assets/images";
import { BookTemplateIcon, DesktopCursorIcon } from "@/components/ui/icons";
import { TLearnPageContent } from "@/types";

export const LEARN_PAGE_CONTENT: TLearnPageContent = {
  // The title to show near the browsers favicon or in social media open graph
  pageTitle: "Learn",
  pageHeader: "Learn",
  comingSoonText: "Coming Soon",
  heroHeading: {
    firstSegment: "fAIr helps you map with",
    secondSegment: "open",
    thirdSegment: "geo-AI",
    fourthSegment: "models,",
    fifthSegment: "and you",
    sixthSegment: "check",
    seventhSegment: "every result.",
  },

  heroDescription:
    "Start with a model someone already made. When you need it to work better in your area, fine-tune it through the API and publish your local version for others to use.",
  sectionHeaders: {
    guides: "Guides",
    videos: "Videos",
    courses: "Trainings",
    updates: "fAIr Updates",
  },
  courses: [
    {
      title: "Beginner Course",
      courseLength: "10 course content",
      language: "English",
      duration: "2 hours",
      available: false,
      courseImage: BeginnerCourseImage,
    },
    {
      title: "Intermediate Course",
      courseLength: "8 course content",
      language: "English",
      duration: "4hr",
      available: false,
      courseImage: IntermediateCourseImage,
    },
    {
      title: "Advanced Course",
      courseLength: "14 course content",
      language: "English",
      duration: "8hr",
      available: false,
      courseImage: AdvancedCourseImage,
    },
  ],
  guides: [
    {
      title: "Onscreen Tutorial",
      description: "Step-by-step tutorials inside fAIr.",
      icon: DesktopCursorIcon,
      isVideo: true,
      onClick: () => null,
      buttonText: "Open",
      comingSoon: true,
    },
    {
      title: "Quick Guide",
      description: "A short guide to running a model on your area.",
      icon: BookTemplateIcon,
      href: "https://hotosm.github.io/fAIr/guides/using-fair/",
      isLink: true,
      buttonText: "Open",
      comingSoon: false,
    },
  ],
  videos: [
    {
      title: "Demo of fAIr, responsible AI-assisted mapping - October 2023",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      link: "https://www.youtube.com/embed/N2_9Bvm05_0?si=to_2aoeRCW3APmmZ",
    },
    {
      title: "Video Title 2",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      link: "https://www.youtube.com/embed/N2_9Bvm05_0?si=to_2aoeRCW3APmmZ",
    },
    {
      title: "Video Title 3",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      link: "https://www.youtube.com/embed/N2_9Bvm05_0?si=to_2aoeRCW3APmmZ",
    },
  ],
};
