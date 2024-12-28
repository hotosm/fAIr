import { CreativeCommonsBadge } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import {
  FacebookIcon,
  GitHubIcon,
  InstagramIcon,
  XIcon,
  YouTubeIcon,
} from "@/assets/svgs";
import { SHARED_CONTENT } from "@/constants";

const socials = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/hotosm",
    logo: FacebookIcon,
  },
  {
    name: "X",
    url: "https://twitter.com/hotosm/",
    logo: XIcon,
  },
  {
    name: "GitHub",
    url: "https://github.com/hotosm/fair",
    logo: GitHubIcon,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/user/hotosm",
    logo: YouTubeIcon,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/hot.osm/",
    logo: InstagramIcon,
  },
];
export const Footer = () => {
  return (
    <footer>
      <div className="grid grid-cols-12 grid-rows-2 gap-y-[67px] app-padding bg-dark text-white py-[77px]">
        <div className="col-span-12 grid grid-cols-8 lg:grid-cols-12  gap-x-[40px] gap-y-[40px]">
          <div className="col-span-8 lg:col-span-4">
            <p className="text-body-1">{SHARED_CONTENT.footer.title}</p>
          </div>
          <div className="col-span-8 uppercase text-body-2 flex  lg:col-start-7 lg:col-span-4  w-full justify-between">
            <ul className="space-y-4">
              {SHARED_CONTENT.footer.siteMap.groupOne.map((route, id) => (
                <li key={`footer-link-${id}`}>
                  <Link
                    href={route.route}
                    title={route.title}
                    className="!text-white"
                    nativeAnchor={false}
                  >
                    {route.title}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="space-y-4">
              {SHARED_CONTENT.footer.siteMap.groupTwo.map((route, id) => (
                <li key={`footer-links2-${id}`}>
                  <Link
                    href={route.route}
                    title={route.title}
                    className="!text-white"
                    nativeAnchor={route.isExternalLink}
                    blank={route.isExternalLink}
                  >
                    {route.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-12 grid grid-cols-8 lg:grid-cols-12 lg:grid-rows-1 gap-x-[40px] gap-y-[40px] lg:gap-y-0">
          <div className="col-span-8 lg:col-span-4 flex flex-col gap-y-5">
            <div>
              <Image
                src={CreativeCommonsBadge}
                alt="Creative Commons Badge"
                title="Creative Commons Badge"
              />
            </div>
            <div className="space-y-5 text-body-3">
              <p>{SHARED_CONTENT.footer.copyright.firstSegment}</p>
              <p>{SHARED_CONTENT.footer.copyright.secondSegment}</p>
            </div>
          </div>
          <div className="col-span-8 flex flex-col lg:col-start-10 lg:col-span-4 w-full justify-start items-start lg:justify-end lg:items-end space-y-4">
            <ul className="flex space-x-[11px]">
              {socials.map((media, id) => (
                <li
                  key={`social-link-${id}`}
                  className="w-7 h-7 flex  items-center justify-center bg-white rounded-full"
                >
                  <Link href={media.url} title={media.name} blank>
                    <Image
                      src={media.logo}
                      alt={`${media.name} Icon`}
                      title={`${media.name}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={"https://osm.org/about"}
              title={SHARED_CONTENT.footer.socials.ctaText}
              blank
              className="!normal-case text-body-3 !text-white"
            >
              <p>{SHARED_CONTENT.footer.socials.ctaText}</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white w-full h-[56px]">
        <p className="text-body-3 text-center space-x-1">
          <span>{SHARED_CONTENT.footer.madeWithLove.firstSegment}</span>
          <Link
            href={"https://www.hotosm.org/"}
            title={SHARED_CONTENT.footer.madeWithLove.fourthSegment}
            blank
            className="!text-body-3"
          >
            <strong>{SHARED_CONTENT.footer.madeWithLove.secondSegment}</strong>
          </Link>
          <span>{SHARED_CONTENT.footer.madeWithLove.thirdSegment}</span>
          <Link
            href={"https://github.com/hotosm/fAIr/graphs/contributors"}
            title={SHARED_CONTENT.footer.madeWithLove.fourthSegment}
            blank
            className="!lowercase !text-body-3"
          >
            <strong>{SHARED_CONTENT.footer.madeWithLove.fourthSegment}</strong>
          </Link>
        </p>
      </div>
    </footer>
  );
};
