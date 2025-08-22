import { CreativeCommonsBadge } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { SHARED_CONTENT } from "@/constants";
import {
  FacebookIcon,
  GitHubIcon,
  InstagramIcon,
  XIcon,
  YouTubeIcon,
} from "@/assets/svgs";
import { MadeWithLove } from "@/components/shared";
import { footerLinks } from "@/constants/general";

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
      <div className="app-padding grid grid-cols-12 grid-rows-2 gap-y-[67px] bg-dark py-[77px] text-white">
        <div className="col-span-12 grid grid-cols-8 gap-[40px]  lg:grid-cols-12">
          <div className="col-span-8 lg:col-span-4">
            <p className="text-body-1">{SHARED_CONTENT.footer.title}</p>
          </div>
          <div className="col-span-8 flex w-full justify-between  text-body-2 uppercase  lg:col-span-4 lg:col-start-7">
            <ul className="space-y-4">
              {footerLinks.groupOne
                .filter((link) => link.active)
                .map((route, id) => (
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
              {footerLinks.groupTwo
                .filter((link) => link.active)
                .map((route, id) => (
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
        <div className="col-span-12 grid grid-cols-8 gap-[40px] lg:grid-cols-12 lg:grid-rows-1 lg:gap-y-0">
          <div className="col-span-8 flex flex-col gap-y-5 lg:col-span-4">
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
          <div className="col-span-8 flex w-full flex-col items-start justify-start space-y-4 lg:col-span-4 lg:col-start-10 lg:items-end lg:justify-end">
            <ul className="flex space-x-[11px]">
              {socials.map((media, id) => (
                <li
                  key={`social-link-${id}`}
                  className="flex size-7 items-center  justify-center rounded-full bg-white"
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
              className="text-body-3 !normal-case !text-white"
            >
              <p>{SHARED_CONTENT.footer.socials.ctaText}</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex h-[56px] w-full items-center justify-center bg-white">
        <MadeWithLove />
      </div>
    </footer>
  );
};
