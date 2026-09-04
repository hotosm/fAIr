import { AdvancedCourseImage, BeginnerCourseImage, IntermediateCourseImage } from "@/assets/images";
import { BookTemplateIcon, DesktopCursorIcon } from "@/components/ui/icons";
import { TLearnPageContent } from "@/types";

export const LEARN_PAGE_CONTENT: TLearnPageContent = {
  // The title to show near the browsers favicon or in social media open graph
  pageTitle: "Learn",
  pageHeader: "Learn",
  comingSoonText: "Coming Soon",
  heroHeading: {
    firstSegment: "fAIr is built to make mapping",
    secondSegment: "easier",
    thirdSegment: "and",
    fourthSegment: "faster",
    fifthSegment: "while you maintain",
    sixthSegment: "100% control",
    seventhSegment: "of the map.",
  },

  heroDescription:
    "Everybody can create a model that work for their mapping area and can as well use already existing models that is similar to their area of interest. Which ever path you choose fAIr is there to make your mapping experience a lot less daunting.",
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
      description:
        "Learn step by step directly on your screen with our interactive tutorials, guiding you through every feature to make using fAIr effortless.",
      icon: DesktopCursorIcon,
      isVideo: true,
      onClick: () => null,
      buttonText: "Open",
      comingSoon: true,
    },
    {
      title: "Quick Guide",
      description:
        "Get started fast with our concise guide. Find essential tips, shortcuts, and instructions to navigate and use fAIr efficiently.",
      icon: BookTemplateIcon,
      href: "https://learnmore.com",
      isLink: true,
      buttonText: "Open",
      comingSoon: true,
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
