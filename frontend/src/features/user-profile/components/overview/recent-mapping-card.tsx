import { Button } from "@/components/ui/button";
import { MapIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { ButtonVariant } from "@/enums";

export const RecentMappingCard = () => {
  return (
    <section className="flex flex-col gap-6 overflow-hidden rounded-2xl bg-dark p-5 text-white md:flex-row">
      <div className="flex flex-1 flex-col">
        <p className="text-body-3 text-white/70">Recent Mapping</p>

        <div className="mt-6 flex flex-col gap-y-3">
          <h3 className="text-title-3 font-bold">Buildings in Freetown</h3>
          <span className="w-fit rounded-md bg-white/10 px-3 py-1 text-body-4">
            Buildings
          </span>
          <p className="text-body-4 text-white/60">Edited 24mins ago</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <Link
            href={APPLICATION_ROUTES.TRY_FAIR}
            nativeAnchor={false}
            title="Resume Mapping"
          >
            <Button rounded capitalize={false}>
              Resume Mapping
            </Button>
          </Link>
          <Link
            href={APPLICATION_ROUTES.TRY_FAIR}
            nativeAnchor={false}
            title="Start New Mapping"
          >
            <Button
              rounded
              capitalize={false}
              variant={ButtonVariant.SECONDARY}
            >
              Start New Mapping
            </Button>
          </Link>
        </div>
      </div>

      {/* Map thumbnail placeholder */}
      <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-xl bg-white/5">
        <MapIcon className="size-12 text-white/30" />
      </div>
    </section>
  );
};
