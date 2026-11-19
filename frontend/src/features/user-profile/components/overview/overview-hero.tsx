import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { SHARED_CONTENT } from "@/constants";
import { useGetUserStates } from "@/features/user-profile/api/user-state";
import { MapComponent } from "@/components/map/map";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useEffect } from "react";
import useScreenSize from "@/hooks/use-screen-size";
import { RecentMappingCard } from "@/features/user-profile/components/overview/recent-mapping-card";

const EmptyHeroMap = () => {
  const { mapContainerRef, map } = useMapInstance();

  useEffect(() => {
    if (!map) return;
    map.setCenter([20, 10]);
    map.setZoom(0.8);
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.keyboard.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
  }, [map]);

  return (
    <MapComponent
      map={map}
      mapContainerRef={mapContainerRef}
      zoomControls={false}
      basemaps={false}
    />
  );
};

const RecentMappingSkeleton = () => (
  <section
    role="status"
    aria-label="Loading recent mapping"
    className="contour-bg grid min-h-[410px] min-w-0 grid-cols-1 gap-4 overflow-hidden rounded-none bg-dark p-5 font-archivo text-white sm:grid-cols-[180px_minmax(0,1fr)] sm:rounded-xl sm:p-4"
  >
    <div className="flex min-w-0 flex-col p-1">
      <p className="text-sm font-semibold">Recent Mapping</p>

      <div className="mt-12 space-y-3" aria-hidden="true">
        <div className="h-5 w-4/5 rounded bg-white/15" />
        <div className="h-6 w-24 rounded bg-white/15" />
        <div className="h-3 w-28 rounded bg-white/10" />
      </div>

      <div className="mt-auto space-y-3 pt-8" aria-hidden="true">
        <div className="h-10 w-full rounded-lg bg-white/15" />
        <div className="h-10 w-full rounded-lg bg-white/10" />
      </div>
    </div>

    <div
      className="min-h-[260px] rounded-xl bg-white/10 sm:min-h-0"
      aria-hidden="true"
    />
    <span className="sr-only">Loading your latest mapping activity…</span>
  </section>
);

export const OverviewHero = () => {
  const { data, isPending } = useGetUserStates();
  const latestActivity = data?.results[0];
  const { isSmallViewport } = useScreenSize();

  if (isPending) {
    return <RecentMappingSkeleton />;
  }

  if (latestActivity) {
    return <RecentMappingCard activity={latestActivity} />;
  }

  return (
    // Same box and button as the Recent Mapping card, so the hero doesn't
    // change size once there's a mapping. Phones: square corners, full width.
    <section className="contour-bg grid min-w-0 grid-cols-1 gap-5 overflow-hidden rounded-none bg-dark px-5 py-6 font-archivo text-white sm:min-h-[410px] sm:grid-cols-2 sm:gap-4 sm:rounded-xl sm:p-4">
      {/* Text centred top to bottom beside the map. */}
      <div className="flex min-w-0 flex-col gap-y-4 sm:justify-center sm:gap-y-6 sm:p-4">
        <h1 className="font-semibold text-2xl">
          {SHARED_CONTENT.homepage.jumbotronTitle}
        </h1>
        <p className="text-off-white text-sm">
          {SHARED_CONTENT.homepage.jumbotronHeadline}
        </p>
        <Link
          href={APPLICATION_ROUTES.TRY_FAIR}
          nativeAnchor={false}
          title="Start Mapping"
          className="w-full sm:w-40"
        >
          <Button
            rounded
            capitalize={false}
            size="medium"
            fontSize={isSmallViewport ? "14px" : "12px"}
            className="w-full"
          >
            Start Mapping
          </Button>
        </Link>
      </div>

      <div className="h-48 min-w-0 w-full overflow-hidden rounded bg-white/5 sm:h-auto sm:min-h-0 sm:rounded-xl">
        <EmptyHeroMap />
      </div>
    </section>
  );
};
