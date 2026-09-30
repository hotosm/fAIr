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
    <section className="flex  contour-bg flex-1 gap-4 font-archivo rounded-md bg-dark p-4 text-white ">
      <div className="flex w-full flex-col sm:max-w-[220px] gap-y-8 p-4">
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

      <div className="flex-1 sm:flex hidden rounded-md w-full overflow-hidden">
        <HeroMap />
      </div>
    </section>
  );
};
