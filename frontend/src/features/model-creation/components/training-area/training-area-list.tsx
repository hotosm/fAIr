import TrainingAreaItem from "./training-area-item";
import { useGetTrainingAreas } from "../../hooks/use-training-areas";
import Pagination from "@/components/pagination";
import { useState } from "react";

const TrainingAreaList = ({ datasetId }: { datasetId: number }) => {
  const [offset, setOffset] = useState(0);
  const { data, isPending, isPlaceholderData } = useGetTrainingAreas(
    datasetId,
    offset,
  );

  return (
    <div className="flex flex-col gap-y-4 h-[70%] justify-between  p-4 ">
      <div className="flex flex-col gap-y-4">
        <p className="text-body-1">
          Training Area{" "}
          <span className="text-white bg-primary text-body-1 rounded-xl px-3 py-1">
            {data?.count}
          </span>
        </p>
        <div>
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
          />
        </div>
      </div>

      <div className="flex items-center justify-center h-full">
        {data?.count === 0 ? (
          <div className="flex items-center justify-center flex-col gap-y-10 text-center">
            <svg
              width="47"
              height="51"
              viewBox="0 0 47 51"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.742188"
                width="45.5156"
                height="50.1807"
                rx="4"
                fill="#F7F9FA"
              />
              <rect
                x="6.1875"
                y="6.89551"
                width="34.625"
                height="15.6638"
                rx="3"
                fill="#E3E5E6"
              />
              <rect
                x="6.1875"
                y="27.6211"
                width="34.625"
                height="15.6638"
                rx="3"
                fill="#E3E5E6"
              />
            </svg>
            <p className="text-gray">
              No Training Area (TA) added yet. Start by drawing a TA on the map
              or upload a TA from your device.
            </p>
          </div>
        ) : isPending ? (
          <div className="w-full h-full animate-pulse bg-light-gray"></div>
        ) : (
          <div className="h-full max-h-[70%] overflow-y-auto flex flex-col gap-y-4 w-full">
            {data?.results.features.map((ta, id) => (
              <TrainingAreaItem
                {...ta}
                key={`training-area-${id}`}
                id={ta.id}
                datasetId={datasetId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingAreaList;
