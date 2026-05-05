import { Button } from "@/components/ui/button";
import { NoTrainingAreaIcon, MapIcon } from "@/components/ui/icons";
import { TOfflinePrediction } from "@/types";
import { formatDate, formatNumber } from "@/utils";

type AIPredictionsListProps = {
  data: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  onViewResults: (prediction: TOfflinePrediction) => void;
  onViewDetails: (prediction: TOfflinePrediction) => void;
};

const ListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className="w-full h-16 bg-light-gray rounded-lg animate-pulse"
      />
    ))}
  </div>
);

export const AIPredictionsList = ({
  data,
  isPending,
  isError,
  refetch,
  onViewResults,
  onViewDetails,
}: AIPredictionsListProps) => {
  if (isPending) {
    return <ListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-y-4">
        <p className="text-grey text-body-2base">
          Error loading AI predictions.
        </p>
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-y-4 items-center justify-center py-20">
        <NoTrainingAreaIcon />
        <p className="text-grey text-body-2base">No AI predictions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body-3">
        <thead>
          <tr className="border-b border-gray-border text-grey uppercase text-body-4">
            <th className="py-3 px-4 font-semibold">Name</th>
            <th className="py-3 px-4 font-semibold">ID</th>
            <th className="py-3 px-4 font-semibold">Features</th>
            <th className="py-3 px-4 font-semibold">Model</th>
            <th className="py-3 px-4 font-semibold">Published</th>
            <th className="py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((prediction) => {
            const title =
              prediction.description || `Prediction ${prediction.id}`;
            return (
              <tr
                key={prediction.id}
                className="border-b border-gray-border hover:bg-frosted-blue transition-colors cursor-pointer"
                onClick={() => onViewDetails(prediction)}
                data-testid={`published-prediction-row-${prediction.id}`}
              >
                <td className="py-3 px-4 font-medium text-dark max-w-[200px] truncate">
                  {title}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[#D3180C] bg-[#FFE5E5] rounded-2xl py-1 px-3 text-body-4 font-medium">
                    {prediction.id}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-x-1">
                    <MapIcon className="icon shrink-0" />
                    {formatNumber(prediction.result?.count ?? 0)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {prediction.config.model_id || "-"}
                </td>
                <td className="py-3 px-4">
                  {prediction.published_at
                    ? formatDate(prediction.published_at, true)
                    : "-"}
                </td>
                <td className="py-3 px-4">
                  <Button
                    className="!w-fit"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewResults(prediction);
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
