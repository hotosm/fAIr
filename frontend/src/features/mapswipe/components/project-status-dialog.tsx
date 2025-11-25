import { fAIrSwipeIllustration } from "@/assets/images";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FilledCalendarIcon,
  FilledFlagIcon,
  FilledLocationIcon,
  ProductionCheckmarkIcon,
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

export type InfoCardProps = {
  icon: React.ReactNode;
  info?: string;
  orientation?: "left" | "right";
  variant?: "default" | "red";
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

const InfoBlock = ({
  icon,
  info,
  orientation = "left",
  variant = "default",
}: InfoCardProps) => {
  const isRight = orientation === "right";

  return (
    <Badge
      variant={variant as TBadgeVariants}
      className="py-3 px-4 flex items-center h-10 rounded-full text-black"
    >
      <div className={`flex items-center justify-center w-full`}>
        {!isRight && (
          <div className={`${info && "mr-3"} flex-shrink-0`}>{icon}</div>
        )}
        {info}
        {isRight && info && <div className="ml-3 flex-shrink-0">{icon}</div>}
      </div>
    </Badge>
  );
};
export const MapswipeProjectStatusDialog = ({
  isOpen,
  onClose,
  mapSwipeProjectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  mapSwipeProjectId: string;
}) => {
  const { isLoading, data, isError, isRefetching, refetch } =
    useMapSwipeProjectStatus(mapSwipeProjectId, isOpen);

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
            <h1 className="text-black text-body-1 md:text-title-2 font-semibold">
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
                icon={<ProductionCheckmarkIcon className="text-black size-4" />}
                info={formatMapSwipeProjectStatus(data?.projectType as string)}
              />
              <InfoBlock
                icon={<FilledLocationIcon className="text-black size-4" />}
                info={truncateString(data?.region as string)}
              />
              <InfoBlock
                icon={<FilledFlagIcon className="text-black size-4" />}
                info={data?.requestingOrganization.name as string}
              />
              <InfoBlock
                icon={<FilledCalendarIcon className="text-black size-4" />}
                info={formatDate(data?.createdAt as string)}
              />
            </div>
            <div className="inline-flex items-center gap-x-4">
              <InfoBlock
                icon={
                  <CopyButton
                    text={data?.webUrl as string}
                    tooltipContent="Copy Project URL "
                  />
                }
                variant="red"
              />
              <ToolTip
                content={
                  data?.status !== "PUBLISHED"
                    ? "This project isn't published yet. It will be viewable once published."
                    : "Open the project on MapSwipe Web."
                }
              >
                {data?.status === "PUBLISHED" ? (
                  <a
                    href={data.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InfoBlock
                      icon={<ExternalLinkIcon className="text-black size-4" />}
                      info="Open in MapSwipe"
                      orientation="right"
                      variant="red"
                    />
                  </a>
                ) : (
                  <InfoBlock
                    icon={<ExternalLinkIcon className="text-black size-4" />}
                    info="Open in MapSwipe"
                    orientation="right"
                    variant="red"
                  />
                )}
              </ToolTip>
            </div>
            <div className="flex items-center w-full justify-between gap-4 flex-wrap">
              <div className="flex flex-col w-full xl:w-2/3 gap-2">
                <div className="flex items-center justify-between  text-nowrap text-grey font-medium text-body-3 md:text-body-2">
                  <p>Project Completion</p>
                  <p>
                    <span className="font-bold">{data?.progress}</span>%
                    Complete
                  </p>
                </div>

                <div className="h-[6px] bg-light-gray w-full rounded-md">
                  <div
                    className="h-[6px] bg-primary rounded-md"
                    style={{ width: `${data?.progress}%` }}
                  ></div>
                </div>
              </div>

              <ToolTip
                content={
                  !data?.exportResults
                    ? "Download options will be ready when the project is finished."
                    : "Download results."
                }
              >
                <ButtonWithIcon
                  onClick={() => {
                    downloadFile(data?.exportResults?.file.url as string);
                  }}
                  variant={ButtonVariant.PRIMARY}
                  className="md:!w-fit"
                  suffixIcon={DownloadIcon}
                  label="Download Result"
                  uppercase={false}
                  disabled={!data?.exportResults}
                />
              </ToolTip>
            </div>
            <div className="flex flex-col text-nowrap text-grey font-medium gap-2 text-body-3 md:text-body-2">
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
                <h1 className="text-black text-body-3 md:text-body-2 font-semibold">
                  Project Description
                </h1>
                <p className="text-body-3 text-black text-wrap max-w-lg md:max-w-2xl">
                  {data?.description}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="text-black text-body-3 md:text-body-2 font-semibold">
                  Project Instruction
                </h1>
                <p className=" text-black text-body-3 text-wrap max-w-lg md:max-w-2xl">
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
