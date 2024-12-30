import { Dispatch, SetStateAction } from 'react';
import { fetchOSMDatabaseLastUpdated } from '@/features/model-creation/hooks/use-training-areas';
import { formatDuration } from '@/utils';
import { Map } from 'maplibre-gl';
import { NoTrainingAreaIcon } from '@/components/ui/icons';
import { PaginatedTrainingArea } from '@/types';
import { Pagination } from '@/components/shared';
import { TrainingAreaItem } from '@/features/model-creation/components/training-area/training-area-item';
import { useQuery } from '@tanstack/react-query';
import {
  OSM_LAST_UPDATED_POOLING_INTERVAL_MS,
  MODELS_CONTENT,
} from "@/constants";

const TrainingAreaList = ({
  offset,
  setOffset,
  datasetId,
  data,
  isPending,
  isPlaceholderData,
  map,
}: {
  datasetId: number;
  data?: PaginatedTrainingArea;
  isPending: boolean;
  isPlaceholderData: boolean;
  offset: number;
  setOffset: Dispatch<SetStateAction<number>>;
  map: Map | null;
}) => {
  const {
    data: osmData,
    isPending: isOSMPending,
    isError: isOSMError,
  } = useQuery({
    queryKey: ["osm-database-last-updated"],
    queryFn: fetchOSMDatabaseLastUpdated,
    refetchInterval: OSM_LAST_UPDATED_POOLING_INTERVAL_MS,
  });

  return (
    <div className="flex max-h-[60%] flex-col gap-y-4 justify-between p-2 lg:p-4">
      <div className="flex items-start w-full flex-col gap-y-4">
        <p className="text-body-2">
          {MODELS_CONTENT.modelCreation.trainingArea.form.trainingArea}
          {`${data && data.count > 1 ? "s" : ""}`}{" "}
          <span className="text-white bg-primary text-body-3 font-medium rounded-xl px-3 py-1">
            {data?.count ?? 0}
          </span>
        </p>
        <span className="flex flex-col gap-y-1 text-gray italic">
          {isOSMPending || isOSMError ? (
            ""
          ) : (
            <small>
              {
                MODELS_CONTENT.modelCreation.trainingArea.toolTips
                  .lastUpdatedPrefix
              }{" "}
              {formatDuration(
                new Date(String(osmData?.lastUpdated)),
                new Date(),
                1,
              )}{" "}
              ago
            </small>
          )}
        </span>
        <div className="w-full">
          <Pagination
            hasNextPage={data?.hasNext}
            hasPrevPage={data?.hasPrev}
            offset={offset}
            disableNextPage={!data?.hasNext || isPlaceholderData}
            disablePrevPage={!data?.hasPrev}
            pageLimit={20}
            totalLength={data?.count}
            setOffset={setOffset}
            isPlaceholderData={isPlaceholderData}
            showCountOnMobile
            centerOnMobile={false}
          />
        </div>
      </div>
      <div className="flex items-center justify-center h-full">
        {data?.count === 0 ? (
          <div className="flex items-center justify-center flex-col gap-y-10 text-center">
            <NoTrainingAreaIcon />
            <p className="text-gray">
              No Training Area (TA) added yet. Start by drawing a TA on the map
              or upload a TA from your device.
            </p>
          </div>
        ) : isPending ? (
          <div className="w-full h-full animate-pulse bg-light-gray"></div>
        ) : (
          <div className="h-full overflow-y-auto flex flex-col gap-y-4 w-full">
            {data?.results.features
              .sort((a, b) => b.id - a.id)
              .map((ta) => (
                <TrainingAreaItem
                  {...ta}
                  key={`training-area-${ta.id}`}
                  id={ta.id}
                  datasetId={datasetId}
                  geometry={ta.geometry}
                  offset={offset}
                  map={map}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingAreaList;
