import { Link } from "@/components/ui/link";
import { PROFILE_NAVIGATION_TABS } from "@/constants";
import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

export const ProfileNavigationTabs = () => {
  const { pathname } = useLocation();
  const activeTabRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to the active tab when the pathname changes.
   */
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [pathname]);

  return (
    <section className="hide-scrollbar overflow-x-auto border-b border-gray-border px-4 md:px-8">
      <ul className="flex gap-x-20 px-4 transition-all duration-300">
        {PROFILE_NAVIGATION_TABS.filter((route) => route.active).map(
          (route) => (
            <li key={route.title}>
              <div ref={pathname === route.href ? activeTabRef : null}>
                <Link
                  href={route.href}
                  title={route.title}
                  nativeAnchor={false}
                  disableLinkStyle
                  className={`flex flex-col whitespace-nowrap text-body-3 text-grey transition-all duration-300`}
                >
                  {route.title}
                  <span
                    className={`h-1 w-[120%] self-center rounded-t-3xl transition-all duration-100 ${pathname === route.href ? "visible bg-red-500" : "invisible"}`}
                  ></span>
                </Link>
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
};
