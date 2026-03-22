import { Badge } from "@/components/ui/badge";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { DropdownPlacement } from "@/enums";
import { MapSwipeProjectIsActive } from "@/features/user-profile/components/offline-predictions/mapswipe-project-active";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { API_ENDPOINTS } from "@/services";
import { TOfflinePrediction } from "@/types";
import { extractDatePart, formatDate, showSuccessToast } from "@/utils";
import { PublishedPredictionDetailsInfo } from "./published-prediction-details-info";

type PublishedPredictionCardProps = {
  prediction: TOfflinePrediction;
  onViewResults: (prediction: TOfflinePrediction) => void;
  onViewDetails: (prediction: TOfflinePrediction) => void;
};

export const PublishedPredictionCard = ({
  prediction,
  onViewResults,
  onViewDetails,
}: PublishedPredictionCardProps) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { dropdownRef } = useDropdownMenu();
  const title = prediction.description || `Prediction ${prediction.id}`;

  const handleDetailsInfo = () => {
    dropdownRef.current?.show();
  };

  return (
    <>
      <div
        className="w-full p-6  relative  space-y-4    bg-frosted-blue rounded-lg flex flex-col"
        data-testid={`published-prediction-card-${prediction.id}`}
      >
        {/* Card header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between ">
            <h3
              className="text-body-2 font-semibold text-gray-900 line-clamp-2 flex-1 "
              title={title}
            >
              {title}
            </h3>
            <DropDown
              disableCheveronIcon
              triggerComponent={
                <Badge
                  variant="default"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg px-2 items-center flex shrink-0"
                >
                  <ElipsisIcon className="icon rotate-90" />
                </Badge>
              }
              className="text-left"
              distance={10}
              placement={DropdownPlacement.BOTTOM_END}
              menuItems={[
                {
                  name: "Download Results",
                  value: "Download Results",
                  subMenuItems: [
                    {
                      name: "As Points",
                      value: "As Points",
                      onClick: () => {
                        const downloadUrl =
                          BASE_API_URL +
                          API_ENDPOINTS.DOWNLOAD_PREDICTION_RESULTS_POINTS_LABELS_FILE_(
                            prediction.id,
                            prediction.config.folder,
                          );
                        window.open(downloadUrl, "_blank");
                      },
                    },
                    {
                      name: "As Polygons",
                      value: "As Polygons",
                      onClick: () => {
                        const downloadUrl =
                          BASE_API_URL +
                          API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                            prediction.id,
                            prediction.config.folder,
                          );
                        window.open(downloadUrl, "_blank");
                      },
                    },
                  ],
                },
                {
                  name: "View Results",
                  value: "View Results",
                  onClick: () => onViewResults(prediction),
                },
                {
                  name: "Copy Result Link",
                  value: "Copy Result Link",
                  onClick: async () => {
                    await copyToClipboard(
                      BASE_API_URL +
                        API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                          prediction.id,
                          prediction.config.folder,
                        ),
                    );
                    showSuccessToast("Copied results link to clipboard!");
                  },
                },
                ...(prediction.mapswipe_id
                  ? [
                      {
                        name: "View MapSwipe Project",
                        value: "View MapSwipe Project",
                        onClick: () => onViewDetails(prediction),
                      },
                    ]
                  : []),
                {
                  name: "Copy Imagery Link",
                  value: "Copy Imagery Link",
                  onClick: async () => {
                    await copyToClipboard(prediction.config.source);
                    showSuccessToast("Copied imagery link to clipboard!");
                  },
                },
                {
                  name: "Details",
                  value: "Details",
                  onClick: (e) => {
                    e.stopPropagation();
                    handleDetailsInfo();
                  },
                },
              ]}
            />
          </div>
          <div className="flex justify-between">
            <Badge
              variant="default"
              className="rounded-[4px] bg-primary text-white font-semibold"
            >
              <span className="text-body-3 uppercase">ID: {prediction.id}</span>
            </Badge>

            <MapSwipeProjectIsActive
              MapSwipeId={prediction.mapswipe_id as string}
              isCard
              onClick={() => onViewDetails(prediction)}
            />
          </div>
        </div>

        {/* Card body */}
        <div className="">
          <div className=" flex  items-center justify-between text-body-4 text-grey">
            <div>
              <p className="text-dark text-body-4">Model Used:</p>
              <span className="font-semibold">{prediction.model_name}</span>
            </div>
            <div>
              <p className="text-dark flex justify-end flex-col text-body-4">
                Date Published:{" "}
                <span className="font-semibold">
                  {prediction.published_at
                    ? formatDate(
                        extractDatePart(prediction.published_at as string),
                      )
                    : "-"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Added the  */}
        <div className="absolute top-0 right-0">
          <PublishedPredictionDetailsInfo
            prediction={prediction}
            modelUsed={prediction.model_name}
            createdBy={prediction.user.username}
            dropdownRef={dropdownRef}
          />
        </div>
      </div>
    </>
  );
};
