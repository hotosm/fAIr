import { CheckIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants";
import { TTrainingDataset } from "@/types";

export const DatasetCard = ({
  dataset,
  showUsername = false,
  selectedDatasetId,
  onDatasetSelect,
  navigateOnClick = false,
}: {
  dataset: TTrainingDataset;
  showUsername?: boolean;
  selectedDatasetId?: number;
  onDatasetSelect?: (dataset: TTrainingDataset) => void;
  navigateOnClick?: boolean;
}) => {
  const handleClick: React.MouseEventHandler = () => {
    if (navigateOnClick) {
      return;
    }
    onDatasetSelect && onDatasetSelect(dataset);
  };

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if ((e.key === "Enter" || e.key === " ") && onDatasetSelect) {
      e.preventDefault();
      onDatasetSelect(dataset);
    }
  };

  return (
    <Link
      disableLinkStyle
      nativeAnchor={false}
      title={dataset.name}
      href={
        navigateOnClick ? `${APPLICATION_ROUTES.DATASETS}/${dataset.id}` : "#"
      }
      onClick={!navigateOnClick ? handleClick : undefined}
      onKeyDown={handleKeyDown}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onDatasetSelect && onDatasetSelect(dataset);
          }
        }}
        aria-pressed={selectedDatasetId === dataset.id}
        aria-label={`Dataset ${dataset.name}`}
        className={`w-full relative h-48 border border-gray-border  hover:shadow-sm bg-white rounded-lg p-6 flex flex-col justify-between cursor-pointer  transition-colors duration-150 ${selectedDatasetId === dataset.id ? "outline outline-primary outline-offset-2" : "hover:border-primary"}`}
      >
        <div className="flex flex-col gap-y-2 min-h-1/2 w-full">
          {selectedDatasetId === dataset.id && (
            <div className="w-4 h-4 md:w-6 md:h-6 flex items-center justify-center bg-primary absolute top-2 right-2  rounded-full border border-gray-border">
              <CheckIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
          )}

          <h1 className="text-body-2base md:text-body-1 overflow-hidden text-ellipsis whitespace-normal h-16 line-clamp-2">
            {dataset.name}
          </h1>
          <p className="bg-primary text-white uppercase w-fit px-1 md:px-3 rounded-md text-body-3">
            ID: {dataset.id}
          </p>
        </div>
        <div className="flex justify-between w-full gap-x-4">
          <div className="w-1/2">
            <p className="text-grey text-body-4 md:text-body-3">Used by:</p>
            <p className="text-dark font-semibold text-body-4 md:text-body-3">
              {dataset.models_count} Model{dataset.models_count ? "s" : ""}
            </p>
          </div>
          {showUsername && (
            <div className="w-1/2">
              <p className="text-grey text-body-4 md:text-body-3">
                Created by:
              </p>
              <p className="text-dark font-semibold text-body-4 md:text-body-3 truncate">
                {dataset.user.username}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
