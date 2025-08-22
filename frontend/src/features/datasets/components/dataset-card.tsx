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
    if (onDatasetSelect) {
      onDatasetSelect(dataset);
    }
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
            if (onDatasetSelect) {
              onDatasetSelect(dataset);
            }
          }
        }}
        aria-pressed={selectedDatasetId === dataset.id}
        aria-label={`Dataset ${dataset.name}`}
        className={`relative flex h-48 w-full cursor-pointer  flex-col justify-between rounded-lg border border-gray-border bg-white p-6 transition-colors  duration-150 hover:shadow-sm ${selectedDatasetId === dataset.id ? "outline outline-offset-2 outline-primary" : "hover:border-primary"}`}
      >
        <div className="min-h-1/2 flex w-full flex-col gap-y-2">
          {selectedDatasetId === dataset.id && (
            <div className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full border border-gray-border bg-primary  md:size-6">
              <CheckIcon className="size-3 text-white md:size-4" />
            </div>
          )}

          <h1 className="line-clamp-2 h-16 overflow-hidden text-ellipsis whitespace-normal text-body-2base md:text-body-1">
            {dataset.name}
          </h1>
          <p className="w-fit rounded-md bg-primary px-1 text-body-3 uppercase text-white md:px-3">
            ID: {dataset.id}
          </p>
        </div>
        <div className="flex w-full justify-between gap-x-4">
          <div className="w-1/2">
            <p className="text-body-4 text-grey md:text-body-3">Used by:</p>
            <p className="text-body-4 font-semibold text-dark md:text-body-3">
              {dataset.models_count} Model{dataset.models_count ? "s" : ""}
            </p>
          </div>
          {showUsername && (
            <div className="w-1/2">
              <p className="text-body-4 text-grey md:text-body-3">
                Created by:
              </p>
              <p className="truncate text-body-4 font-semibold text-dark md:text-body-3">
                {dataset.user.username}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
