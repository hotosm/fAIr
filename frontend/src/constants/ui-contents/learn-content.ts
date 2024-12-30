import { BookTemplateIcon, DesktopCursorIcon } from '@/components/ui/icons';
import { TLearnPageContent } from '@/types';

export const LEARN_PAGE_CONTENT: TLearnPageContent = {
  // The title to show near the browsers favicon or in social media open graph
  pageTitle: "Learn",
  pageHeader: "Learn",
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
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
  sectionHeaders: {
    guides: "Guides",
    videos: "Videos",
  },
  guides: [
    {
      title: "Onscreen Tutorial",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      icon: DesktopCursorIcon,
      isVideo: true,
      onClick: () => null,
      buttonText: "Open",
    },
    {
      title: "Quick Guide",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
      icon: BookTemplateIcon,
      href: "https://learnmore.com",
      isLink: true,
      buttonText: "Open",
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
