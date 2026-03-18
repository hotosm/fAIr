import { Badge } from "@/components/ui/badge";
import { ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropDown } from "@/components/ui/dropdown";
import { CopyButton } from "@/components/ui/copy-button";
import {
  CloudDownloadIcon,
  ExternalLinkIcon,
  FilledCalendarIcon,
  MapIcon,
  DatabaseIcon,
  ZoomInIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { BASE_API_URL } from "@/config";
import { ButtonVariant, SHOELACE_SIZES } from "@/enums";
import { API_ENDPOINTS } from "@/services";
import { TBadgeVariants, TOfflinePrediction } from "@/types";
import { formatDate, formatNumber, truncateString } from "@/utils";

type PublishedPredictionDetailDialogProps = {
  prediction: TOfflinePrediction;
  isOpen: boolean;
  onClose: () => void;
};

type InfoCardProps = {
  icon: React.ReactNode;
  info?: string | React.ReactNode;
  variant?: "default" | "red" | "green";
  className?: string;
};

const InfoBlock = ({
  icon,
  info,
  variant = "default",
  className = "cursor-default",
}: InfoCardProps) => {
  return (
    <Badge
      variant={variant as TBadgeVariants}
      className={`py-1 md:py-3 px-3 md:px-4 flex items-center h-8 md:h-10 rounded-full text-black ${className}`}
    >
      <div className="flex items-center justify-center w-full text-body-4 md:text-body-3">
        <div className={`${info && "mr-2"} flex-shrink-0 text-black size-3.5 md:size-4`}>
          {icon}
        </div>
        {info}
      </div>
    </Badge>
  );
};

export const PublishedPredictionDetailDialog = ({
  prediction,
  isOpen,
  onClose,
}: PublishedPredictionDetailDialogProps) => {
  const title = prediction.description || `Prediction ${prediction.id}`;
  const featureCount = prediction.result?.count ?? 0;

  return (
    <Dialog
      isOpened={isOpen}
      closeDialog={onClose}
      preventClose={false}
      noHeader={true}
      noPadding={true}
      size={SHOELACE_SIZES.MEDIUM_LARGE}
    >
      <div className="flex flex-col w-full h-full relative overflow-y-auto max-h-[90vh]">
        {/* Header Map Area */}
        <div className="w-full h-48 md:h-64 sm:h-64 bg-slate-200 relative flex-shrink-0 flex items-center justify-center">
          <MapIcon className="icon-lg text-slate-400" />
          <span className="text-slate-500 ml-2 font-medium">Map Preview</span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 z-10 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-6 md:p-8 flex flex-col gap-4 2xl:gap-6 w-full">
          <div className="inline-flex items-center gap-x-4 w-full">
            <h1 className="text-black text-body-2 md:text-title-3 font-semibold">
              {truncateString(title, 400)}
            </h1>
            <Badge variant="green" className="py-1 px-4 h-8 md:h-8 flex items-center rounded-lg text-sm font-medium">
              Published
            </Badge>
          </div>

          <div className="w-full justify-between flex items-center flex-wrap gap-4 2xl:gap-6">
            <div className="inline-flex items-center justify-between w-full gap-4 flex-wrap">
              <div className="inline-flex items-center gap-4 flex-wrap">
                <InfoBlock
                  icon={<MapIcon />}
                  info={`${formatNumber(featureCount)} Features`}
                />
                <InfoBlock
                  icon={<DatabaseIcon />}
                  info={`Model: ${prediction.config.model_id || "-"}`}
                />
                {prediction.config.zoom_level && (
                  <InfoBlock
                    icon={<ZoomInIcon />}
                    info={`Zoom: ${prediction.config.zoom_level}`}
                  />
                )}
                {prediction.published_at && (
                  <InfoBlock
                    icon={<FilledCalendarIcon />}
                    info={formatDate(prediction.published_at)}
                  />
                )}
              </div>

              <div className="inline-flex items-center justify-end gap-4 flex-wrap">
                <Badge
                  variant="red"
                  className="py-1 md:py-3 px-4 md:px-6 flex items-center h-8 md:h-10 rounded-full text-black"
                >
                  <CopyButton
                    text={
                      BASE_API_URL +
                      API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                        prediction.id,
                        prediction.config.folder
                      )
                    }
                    tooltipContent="Copy Result Link"
                    label="Copy"
                    iconClassName="size-3.5 md:size-4"
                  />
                </Badge>
                {prediction.mapswipe_id && (
                  <a
                    href={`https://mapswipe.org/en/project/${prediction.mapswipe_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InfoBlock
                      icon={<ExternalLinkIcon />}
                      info="Open in Mapswipe"
                      variant="red"
                      className="cursor-pointer text-nowrap"
                    />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center w-full justify-between gap-4 flex-wrap mt-2">
              <div className="flex flex-col xl:w-2/3 gap-2">
                <p className="text-black text-body-4 md:text-body-3">
                  Date Submitted:{" "}
                  <span className="font-semibold text-black">
                    {prediction.created_at
                      ? formatDate(prediction.created_at)
                      : "-"}
                  </span>
                </p>
                {prediction.config.source && (
                  <p className="text-black text-body-4 md:text-body-3">
                    Imagery Source:{" "}
                    <a
                      href={prediction.config.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline font-medium"
                    >
                      View Link
                    </a>
                  </p>
                )}
              </div>

              <DropDown
                triggerComponent={
                  <ButtonWithIcon
                    variant={ButtonVariant.PRIMARY}
                    size={SHOELACE_SIZES.MEDIUM}
                    className="md:!w-fit"
                    suffixIcon={CloudDownloadIcon}
                    contentClassName="text-body-4 md:text-body-3 font-semibold"
                    label="Download Result"
                    uppercase={false}
                  />
                }
                distance={4}
                menuItems={[
                  {
                    name: "As Points",
                    value: "As Points",
                    onClick: (e) => {
                      e.stopPropagation();
                      window.open(
                        BASE_API_URL +
                          API_ENDPOINTS.DOWNLOAD_PREDICTION_RESULTS_POINTS_LABELS_FILE_(
                            prediction.id,
                            prediction.config.folder
                          ),
                        "_blank"
                      );
                    },
                  },
                  {
                    name: "As Polygons",
                    value: "As Polygons",
                    onClick: (e) => {
                      e.stopPropagation();
                      window.open(
                        BASE_API_URL +
                          API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                            prediction.id,
                            prediction.config.folder
                          ),
                        "_blank"
                      );
                    },
                  },
                ]}
              />
            </div>

            <div className="w-full flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <h1 className="text-black text-body-4 md:text-body-3 font-bold">
                  Prediction overview
                </h1>
                <p className="text-body-4 md:text-body-3 text-black text-wrap max-w-lg md:max-w-4xl opacity-80">
                  This prediction includes bounding boxes or polygon detections extracted 
                  by the AI model. Download the results as GeoJSON for Points or Polygons.
                </p>
              </div>
              
              {(prediction.description || prediction.config.source) && (
                <div className="flex flex-col gap-2">
                  <h1 className="text-black text-body-4 md:text-body-3 font-bold">
                    Prediction description
                  </h1>
                  <p className="text-black text-body-4 md:text-body-3 text-wrap max-w-lg md:max-w-4xl opacity-80">
                    {prediction.description || "No specific description provided for this prediction."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
