import { GridIcon } from "@/components/ui/icons/grid-icon";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants";

export const DashboardLink = () => (
  <Link
    href={APPLICATION_ROUTES.PROFILE_BASE}
    nativeAnchor={false}
    disableLinkStyle
    title="Go to your dashboard"
    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-dark bg-white px-3 text-xs font-medium text-dark whitespace-nowrap transition-colors hover:bg-off-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark"
  >
    <GridIcon className="size-4" aria-hidden="true" />
    Dashboard
  </Link>
);
