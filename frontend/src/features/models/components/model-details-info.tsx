import { ButtonWithIcon } from "@/components/ui/button";
import { DirectoryIcon, MapIcon } from "@/components/ui/icons";
import { formatDate, truncateString } from "@/utils";
import ModelDetailItem from "./model-detail-item";
import ModelDetailsSection from "./model-details-section";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { Divider } from "@/components/ui/divider";
import ModelFeedbacks from "./model-feedbacks";

const ModelDetailsInfo = ({
  data,
  openModelFilesDialog,
  openTrainingAreaDialog,
}: {
  data: any;
  openModelFilesDialog: () => void;
  openTrainingAreaDialog: () => void;
}) => (
  <>
    <ModelDetailsSection title="">
      <div className="flex flex-col gap-y-8">
        <div className="inline-flex flex-col gap-y-4">
          <p className="text-gray text-body-2">Model ID: {data?.id}</p>
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-y-8">
            <div className="flex flex-col gap-y-4">
              <h1
                className="font-semibold text-dark text-title-2 md:text-large-title"
                title={data?.name}
              >
                {truncateString(data?.name, 20)}
              </h1>
              <p className="text-body-3 text-gray md:text-body-2">
                {data?.description ?? "Model description is not available."}
              </p>
            </div>
            <div className="max-w-fit">
              <ButtonWithIcon
                label="Start Mapping"
                variant="primary"
                size="medium"
                capitalizeText={false}
                prefixIcon={MapIcon}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="md:self-end flex items-center gap-x-2 cursor-pointer text-primary text-body-2 md:font-semibold"
        onClick={openTrainingAreaDialog}
      >
        <p>View Training Area</p>
        <ChevronDownIcon className="icon -rotate-90" />
      </div>
    </ModelDetailsSection>
    <Divider />
    <ModelDetailsSection title="Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-9">
        <div className="flex flex-col gap-y-4">
          <ModelDetailItem label="Created by" value={data?.user.username} />
          <ModelDetailItem
            label="Created on"
            value={formatDate(data?.created_at as string)}
          />
          <ModelDetailItem
            label="Last Modified"
            value={formatDate(data?.last_modified as string)}
          />
        </div>
        <div className="col-span-1 items-start justify-between flex flex-col gap-y-4">
          <p className="text-dark text-body-2 ">
            <span className="text-gray">Training ID: </span>
            Training_{data?.published_training}
          </p>
          <ButtonWithIcon
            label="Model Files"
            className="border-black border"
            variant="default"
            capitalizeText={false}
            onClick={openModelFilesDialog}
            prefixIcon={DirectoryIcon}
          />
        </div>
        <div className="col-span-1 flex flex-col md:items-end md:justify-between gap-y-4">
          <ModelFeedbacks trainingId={data?.published_training as number} />
        </div>
      </div>
    </ModelDetailsSection>
  </>
);

export default ModelDetailsInfo;
