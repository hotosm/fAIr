import CreativeCommonsBadge from "@/assets/images/cc_by_badge.png";
import FacebookLogo from "@/assets/svgs/socials/facebook_logo.svg";
import GitHubLogo from "@/assets/svgs/socials/github_logo.svg";
import XLogo from "@/assets/svgs/socials/x_logo.svg";
import InstagramLogo from "@/assets/svgs/socials/instagram_logo.svg";
import YoutTubeLogo from "@/assets/svgs/socials/youtube_logo.svg";
import { APP_CONTENT } from "@/utils/content";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";

const socials = [
  {
    name: "Facebook",
    url: "#",
    logo: FacebookLogo,
  },
  {
    name: "X",
    url: "#",
    logo: XLogo,
  },
  {
    name: "GitHub",
    url: "#",
    logo: GitHubLogo,
  },
  {
    name: "YouTube",
    url: "#",
    logo: YoutTubeLogo,
  },
  {
    name: "Instagram",
    url: "#",
    logo: InstagramLogo,
  },
];
const Footer = () => {
  return (
    <footer>
      <div className="grid grid-cols-12 grid-rows-2 gap-y-[67px] px-[20px] lg:px-[80px] bg-dark text-white py-[77px]">
        <div className="col-span-12 grid grid-cols-8 lg:grid-cols-12  gap-x-[40px] gap-y-[40px]">
          <div className="col-span-8 lg:col-span-4">
            <p className="text-body-1">{APP_CONTENT.footer.title}</p>
          </div>
          <div className="col-span-8 uppercase text-body-2 flex  lg:col-start-7 lg:col-span-4  w-full justify-between">
            <ul className="space-y-4">
              {APP_CONTENT.footer.siteMap.groupOne.map((route, id) => (
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
              {APP_CONTENT.footer.siteMap.groupTwo.map((route, id) => (
                <li key={`footer-links2-${id}`}>
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
              <p>{APP_CONTENT.footer.copyright.firstSegment}</p>
              <p>{APP_CONTENT.footer.copyright.secondSegment}</p>
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
            <p className="text-body-3">{APP_CONTENT.footer.socials.ctaText}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white w-full h-[56px]">
        <p className="text-body-3 text-center space-x-1">
          <span>{APP_CONTENT.footer.madeWithLove.firstSegment}</span>
          <strong>{APP_CONTENT.footer.madeWithLove.secondSegment}</strong>
          <span>{APP_CONTENT.footer.madeWithLove.thirdSegment}</span>
          <strong>{APP_CONTENT.footer.madeWithLove.fourthSegment}</strong>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
