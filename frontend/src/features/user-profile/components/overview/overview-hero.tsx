import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { MapComponent } from "@/components/map/map";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useEffect } from "react";
import { SHARED_CONTENT } from "@/constants";

const HeroMap = () => {
  const { mapContainerRef, map } = useMapInstance();

  // Centre the world and fix the view — no panning/zooming allowed.
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
    <div className="relative h-full w-full rounded-md">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        zoomControls={false}
        basemaps={false}
      />
    </div>
  );
};

export const OverviewHero = () => {
  return (
    <section className="grid min-w-0 grid-cols-1 sm:grid-cols-2 contour-bg gap-4 font-archivo rounded-md bg-dark p-4 text-white">
      <div className="flex min-w-0 flex-col gap-y-6 p-2 sm:p-4">
        <h1 className="font-semibold text-2xl">
          {SHARED_CONTENT.homepage.jumbotronTitle}
        </h1>
        <p className="text-off-white text-sm">
          AI-powered assistant that replicates your mapping samples
          intelligently and quickly, helping you map smarter and faster.
        </p>
        <Link
          href={APPLICATION_ROUTES.TRY_FAIR}
          nativeAnchor={false}
          title=""
          className="w-fit"
        >
          <Button fontSize={"14px"} rounded capitalize={false}>
            Start Mapping
          </Button>
        </Link>
      </div>

      <div className="hidden min-h-64 min-w-0 rounded-md w-full overflow-hidden sm:block">
        <HeroMap />
      </div>
    </section>
  );
};
