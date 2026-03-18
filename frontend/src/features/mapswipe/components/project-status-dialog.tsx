import { fAIrSwipeIllustration } from "@/assets/images";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FilledCalendarIcon,
  FilledFlagIcon,
  FilledLocationIcon,
  MapIcon,
  ProductionCheckmarkIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { Image } from "@/components/ui/image";

import { ButtonVariant } from "@/enums/common";
import { useMapSwipeProjectStatus } from "../hooks/use-mapswipe-project";
import { MapSwipeProjectStatusBadge } from "./project-status-badge";
import { downloadFile, formatDate, truncateString } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { formatMapSwipeProjectStatus } from "@/utils/mapswipe-utils";
import { TBadgeVariants } from "@/types";
import { ToolTip } from "@/components/ui/tooltip";
import { MapSwipeProcessingStatus, PmtilesConversionStatus } from "@/enums";
import { DropDown } from "@/components/ui/dropdown";

export type InfoCardProps = {
  icon: React.ReactNode;
  info?: string;
  orientation?: "left" | "right";
  variant?: "default" | "red";
  className?: string;
};

const ProjectStatusLoadingSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-4 2xl:gap-6 h-full w-full justify-center animate-pulse">
      <div className="w-full h-64 bg-light-gray rounded-md" />
      <div className="w-full h-6 bg-gray-300 rounded" />
      <div className="flex flex-wrap items-center gap-4 w-full">
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center gap-4 w-full">
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
      </div>
      <div className="w-full h-6 bg-gray-200 rounded" />
      <div className="w-full h-24 bg-light-gray rounded-md" />
    </div>
  );
};

const ProjectStatusErrorSkeleton = ({ retry }: { retry: () => void }) => {
  return (
    <div className="flex flex-col items-center gap-4 h-40 w-full justify-between text-center">
      <p className="font-semibold text-lg">Oops! Something went wrong.</p>
      <p>
        The project status couldn't be loaded. It will retry automatically, or
        you can try again manually.
      </p>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
};

const VALID_PROJECT_STATUSES = [
  MapSwipeProcessingStatus.PUBLISHED,
  MapSwipeProcessingStatus.FINISHED,
];

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
      <div
        className={`flex items-center justify-center w-full text-body-4 md:text-body-3`}
      >
        <div
          className={`${info && "mr-2"} flex-shrink-0  text-black size-3.5 md:size-4`}
        >
          {icon}
        </div>
        {info}
      </div>
    </Badge>
  );
};
export const MapswipeProjectStatusDialog = ({
  isOpen,
  onClose,
  mapSwipeProjectId,
  handleMapSwipeProjectResultMapModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  mapSwipeProjectId: string;
  handleMapSwipeProjectResultMapModal: (pmtiles: string) => void;
}) => {
  const { isLoading, data, isError, isRefetching, refetch } =
    useMapSwipeProjectStatus(mapSwipeProjectId, isOpen);

  const pmStatus = data?.results?.mapswipe?.pmtiles_conversion_status as
    | PmtilesConversionStatus
    | undefined;
  const isFinished = pmStatus === PmtilesConversionStatus.FINISHED;

  const pmtilesTooltipContent = (() => {
    if (isFinished) {
      return "Postprocessed results are ready, click to open the results in the map viewer.";
    }
    if (!pmStatus) {
      return "Postprocessing has not started for this project, there are no map results to view yet.";
    }

    return `Postprocessing status: ${pmStatus}, the map results will be available once the status becomes FINISHED.`;
  })();

  return (
    <Dialog
      isOpened={isOpen}
      closeDialog={onClose}
      label={"MapSwipe Project Status"}
    >
      {isLoading ? (
        <ProjectStatusLoadingSkeleton />
      ) : isError ? (
        <ProjectStatusErrorSkeleton retry={refetch} />
      ) : data ? (
        <div className="flex flex-col items-center gap-4 2xl:gap-6 h-full  w-full justify-center">
          <Image
            src={fAIrSwipeIllustration}
            alt="MapSwipe + fAIr Illustration"
            className="w-full h-full"
          />
          <div className="inline-flex items-center gap-x-4 w-full">
            <h1 className="text-black text-body-2 md:text-title-3 font-semibold">
              {truncateString(data?.name, 400)}
          </h1>
            <MapSwipeProjectStatusBadge
              status={data?.status as string}
              isRefetching={isRefetching}
            />
          </div>
          <div className="w-full justify-between flex items-center flex-wrap gap-4 2xl:gap-6">
            <div className="inline-flex items-center gap-4 flex-wrap">
              <InfoBlock
                icon={<ProductionCheckmarkIcon />}
                info={formatMapSwipeProjectStatus(data?.projectType as string)}
              />
              <InfoBlock
                icon={<FilledLocationIcon />}
                info={truncateString(data?.region as string)}
              />
              <InfoBlock
                icon={<FilledFlagIcon />}
                info={data?.requestingOrganization.name as string}
              />
              <InfoBlock
                icon={<FilledCalendarIcon />}
                info={formatDate(data?.createdAt as string)}
              />
            </div>
            <div className="inline-flex items-center justify-start w-full gap-4 flex-wrap">
              <Badge
                variant={"red" as TBadgeVariants}
                className={`py-1 md:py-3 px-4 md:px-6 flex items-center h-8 md:h-10 rounded-full text-black`}
              >
                <CopyButton
                  text={data?.webUrl as string}
                  tooltipContent="Copy Project URL"
                  label="Copy"
                  iconClassName="size-3.5 md:size-4"
                />
              </Badge>

              <ToolTip
                content={
                  !VALID_PROJECT_STATUSES.includes(
                    data?.status as MapSwipeProcessingStatus,
                  )
                    ? "This project isn't published yet. It will be viewable once published."
                    : "Open the project on MapSwipe Web."
                }
              >
                {VALID_PROJECT_STATUSES.includes(
                  data?.status as MapSwipeProcessingStatus,
                ) ? (
                  <a
                    href={data.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InfoBlock
                      icon={<ExternalLinkIcon />}
                      info="Open in MapSwipe"
                      variant="red"
                      className="cursor-pointer text-nowrap"
                    />
                  </a>
                ) : (
                  <InfoBlock
                    icon={<ExternalLinkIcon />}
                    info="Open in MapSwipe"
                    variant="red"
                    className="cursor-not-allowed text-nowrap"
                  />
                )}
              </ToolTip>
              <ToolTip content={pmtilesTooltipContent}>
                <Button
                  variant={ButtonVariant.NONE}
                  className="!w-fit !max-w-52"
                  disabled={!isFinished}
                  onClick={() => {
                    handleMapSwipeProjectResultMapModal(
                      data.results?.mapswipe.post_processed?.pmtiles as string,
                    );
                  }}
                  aria-disabled={!isFinished}
                >
                  <InfoBlock
                    icon={<MapIcon />}
                    info="View MapSwipe Results"
                    variant={"red"}
                    className="cursor-pointer"
                  />
                </Button>
              </ToolTip>

              <ToolTip
                content={
                  isRefetching
                    ? "Checking for updates"
                    : "Check for the latest MapSwipe project updates"
                }
              >
                <Button
                  variant={ButtonVariant.NONE}
                  className="!w-fit !max-w-40"
                  disabled={isRefetching}
                  onClick={() => {
                    refetch();
                  }}
                  aria-disabled={isRefetching}
                >
                  <InfoBlock
                    icon={
                      <RefreshIcon
                        className={`${isRefetching ? "animate-spin cursor-progress" : ""}`}
                      />
                    }
                    info="Check updates"
                    variant={"red"}
                    className="cursor-pointer"
                  />
                </Button>
              </ToolTip>
            </div>
            <div className="flex items-center w-full justify-between gap-4 flex-wrap">
              <div className="flex flex-col w-full xl:w-2/3 gap-2">
                <div className="flex items-center justify-between  text-nowrap text-grey font-medium text-body-4 md:text-body-3">
                  <p>Project Completion</p>
                  <p>
                    <span className="font-bold">
                      {Math.round((data?.progress ?? 0) * 100)}
                    </span>
                    % Complete
                  </p>
                </div>

                <div className="h-[6px] bg-light-gray w-full rounded-md">
                  <div
                    className="h-[6px] bg-primary rounded-md"
                    style={{
                      width: `${Math.round((data?.progress ?? 0) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <ToolTip
                content={
                  !data?.results?.mapswipe?.exportResults
                    ? "Download options will be ready when the project is finished."
                    : "Download results as CSV or GeoJSON."
                }
              >
                <DropDown
                  disabled={!data?.results?.mapswipe?.exportResults}
                  triggerComponent={
                    <ButtonWithIcon
                      variant={ButtonVariant.PRIMARY}
                      size="medium"
                      className="md:!w-fit"
                      suffixIcon={DownloadIcon}
                      contentClassName="text-body-4 md:text-body-3"
                      label="Download Result"
                      uppercase={false}
                      disabled={!data?.results?.mapswipe?.exportResults}
                    />
                  }
                  distance={4}
                  menuItems={[
                    {
                      name: "As CSV",
                      value: "As CSV",
                      onClick: (e) => {
                        e.stopPropagation();

                        downloadFile(
                          data?.results?.mapswipe?.exportResults?.file
                            .url as string,
                        );
                      },
                    },
                    {
                      name: "As GeoJSON",
                      value: "As GeoJSON",
                      onClick: (e) => {
                        e.stopPropagation();
                        downloadFile(
                          data?.results?.mapswipe
                            ?.exportAggregatedResultsWithGeometry?.file
                            ?.url as string,
                        );
                      },
                    },
                  ]}
                />
              </ToolTip>
            </div>
            <div className="flex flex-col text-nowrap text-grey font-medium gap-2 text-body-4 md:text-body-3">
              {data?.lastContributionDate ? (
                <>
                  <p>
                    Last contribution date:{" "}
                    <span className="text-black">
                      {formatDate(data?.lastContributionDate as string)}
                    </span>
                  </p>

                  <p>
                    Contributors:{" "}
                    <span className="text-black">
                      {data?.numberOfContributorUsers}
                    </span>
                  </p>
                </>
              ) : null}
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <h1 className="text-black text-body-4 md:text-body-3 font-semibold">
                  Project Description
                </h1>
                <p className="text-body-4 md:text-body-3 text-black text-wrap max-w-lg md:max-w-2xl">
                  {data?.description}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="text-black text-body-4 md:text-body-3 font-semibold">
                  Project Instruction
                </h1>
                <p className=" text-black text-body-4 md:text-body-3 text-wrap max-w-lg md:max-w-2xl">
                  {data?.projectInstruction}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};
