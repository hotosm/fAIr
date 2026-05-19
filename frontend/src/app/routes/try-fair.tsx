import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { MODELS_LIST, TryFairModel } from "@/features/try-fair/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useEffect, useState } from "react";

export const TryFairPage = () => {
  const { map, mapContainerRef } = useMapInstance(false, false);

  const [selectedModel, setSelectedModel] = useState<TryFairModel>(
    MODELS_LIST[0],
  );
  const [outputType, setOutputType] = useState<TryFairMapOutputType>(
    TryFairMapOutputType.POINTS,
  );
  const [resolution, setResolution] = useState<TryFairResolution>(
    TryFairResolution.MID,
  );
  const [confidence, setConfidence] = useState<number>(30);

  const RESOLUTION_INDEX: Record<TryFairResolution, number> = {
    [TryFairResolution.LOW]: 0,
    [TryFairResolution.MID]: 1,
    [TryFairResolution.HIGH]: 2,
  };

  // Fly to the zoom level that matches the selected resolution
  useEffect(() => {
    if (!map) return;
    const zoomIndex = RESOLUTION_INDEX[resolution];
    const targetZoom = selectedModel.availableZoomLevels[zoomIndex];
    if (targetZoom !== undefined) {
      map.flyTo({ zoom: targetZoom });
    }
  }, [resolution, selectedModel, map]);

  // Reset resolution to MID when the model changes
  const handleSelectModel = (model: TryFairModel) => {
    setSelectedModel(model);
    setResolution(TryFairResolution.MID);
  };

  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />

      <div className="h-screen flex flex-col fullscreen">
        <div className="flex-grow relative">
          {/* Map fills the entire available space */}
          <TryFairMap
            map={map}
            mapContainerRef={mapContainerRef}
            outputType={outputType}
            tileServerURL={selectedModel.tileServiceUrl}
          />

          {/* Floating sidebar panel, absolutely positioned over the map */}
          <div className="absolute top-4 left-4 z-10">
            <TryFairSidebar
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              outputType={outputType}
              onOutputTypeChange={setOutputType}
              resolution={resolution}
              onResolutionChange={setResolution}
              confidence={confidence}
              onConfidenceChange={setConfidence}
            />
          </div>
        </div>
      </div>
    </>
  );
};
