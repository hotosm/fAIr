import { Head } from "@/components/seo";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { TryFairMap } from "@/features/try-fair/components/map/try-fair-map";
import { TryFairSidebar } from "@/features/try-fair/components/try-fair-sidebar";
import { MODELS_LIST, TryFairModel } from "@/features/try-fair/models";
import { useMapInstance } from "@/hooks/use-map-instance";
import { useTileservice } from "@/hooks/use-tileservice";
import { useCallback, useEffect, useState } from "react";
import { getTileServerTypeFromURL } from "@/utils";

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
  const [isDirty, setIsDirty] = useState(true);

  const {
    tileserverURL,
    setTileserverURL,
    tileJSONMetadata,
    tileServiceTypeValidity,
  } = useTileservice(
    getTileServerTypeFromURL(selectedModel.tileServiceUrl),
    selectedModel.tileServiceUrl,
  );

  useEffect(() => {
    setTileserverURL(selectedModel.tileServiceUrl);
  }, [selectedModel.tileServiceUrl, setTileserverURL]);

  useEffect(() => {
    if (!map) return;
    map.flyTo({ center: selectedModel.center, zoom: 18, essential: true });
    map.once("moveend", () => {
      if (map.getZoom() !== 18) map.setZoom(18);
    });
  }, [map, selectedModel, tileJSONMetadata]);

  const handleSelectModel = (model: TryFairModel) => {
    setSelectedModel(model);
    setResolution(TryFairResolution.MID);
    setIsDirty(true);
  };

  const handleResolutionChange = (res: TryFairResolution) => {
    setResolution(res);
    setIsDirty(true);
  };

  const handleConfidenceChange = (value: number) => {
    setConfidence(value);
    setIsDirty(true);
  };

  const handleOutputTypeChange = (type: TryFairMapOutputType) => {
    setOutputType(type);
    setIsDirty(true);
  };

  const handleBBoxChange = useCallback(() => {
    setIsDirty(true);
  }, []);

  return (
    <>
      <Head title={TRY_FAIR_PAGE_CONTENT.pageTitle} />

      <div className="h-screen flex flex-col fullscreen">
        <div className="flex-grow relative">
          <TryFairMap
            map={map}
            mapContainerRef={mapContainerRef}
            outputType={outputType}
            tileServerURL={tileserverURL}
            tileServiceValid={tileServiceTypeValidity.valid}
            onBBoxChange={handleBBoxChange}
          />

          <div className="absolute top-4 left-4 z-10">
            <TryFairSidebar
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              outputType={outputType}
              onOutputTypeChange={handleOutputTypeChange}
              resolution={resolution}
              onResolutionChange={handleResolutionChange}
              confidence={confidence}
              onConfidenceChange={handleConfidenceChange}
              onMap={() => setIsDirty(false)}
              isPredicting={false}
              isMapButtonDisabled={!isDirty}
            />
          </div>
        </div>
      </div>
    </>
  );
};
