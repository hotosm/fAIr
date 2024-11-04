import { useModelFormContext } from "@/app/providers/model-creation-provider";
import {
  DatabaseIcon,
  MapIcon,
  SaveIcon,
  SettingsIcon,
  TagsIcon,
  TextIcon,
  ZoomInIcon,
} from "@/components/ui/icons";
import { StepHeading } from "@/features/model-creation/components/";
import { IconProps } from "@/types";

const SummaryItem = ({
  icon: Icon,
  label,
  content,
}: {
  content: string | string[];
  label: string;
  icon: React.ComponentType<IconProps>;
}) => (
  <div className="flex items-center gap-x-4 gap-y-4">
    <Icon className="icon-lg text-primary" />
    <div>
      <p className="text-gray">{label}</p>
      {Array.isArray(content) ? (
        <div className="flex items-center gap-x-4">
          {content.map((item, index) => (
            <p key={index} className="text-dark">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-dark">{content}</p>
      )}
    </div>
  </div>
);

const ModelSummaryStep = () => {
  const { formData } = useModelFormContext();
  const summaryData = [
    { icon: TagsIcon, label: "Model Name", content: formData.modelName },
    {
      icon: TextIcon,
      label: "Model Description",
      content: formData.modelDescription,
    },
    {
      icon: DatabaseIcon,
      label: "Base Model",
      content: formData.baseModel.toUpperCase(),
    },
    { icon: TagsIcon, label: "Dataset Name", content: formData.datasetName },
    {
      icon: SaveIcon,
      label: "Dataset ID",
      content: formData.selectedTrainingDatasetId,
    },
    {
      icon: MapIcon,
      label: "Open Aerial Imagery",
      content: formData.datasetTileName,
    },
    {
      icon: ZoomInIcon,
      label: "Zoom Levels",
      content: formData.zoomLevels.map((level) => `Zoom ${level}`),
    },
    {
      icon: SettingsIcon,
      label: "Training Settings",
      content: [
        `Epoch: ${formData.epoch}`,
        `Batch Size: ${formData.batchSize}`,
        `Contact Spacing: ${formData.contactSpacing}`,
        `Boundary Width:  ${formData.boundaryWidth}`,
      ],
    },
  ];



  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading="Model Summary"
        description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam sequi incidunt quasi delectus laudantium accusamus modi omnis maiores. Incidunt!"
      />
      {summaryData.map((item, index) => (
        <SummaryItem
          key={index}
          icon={item.icon}
          label={item.label}
          content={item.content}
        />
      ))}
    </div>
  );
};

export default ModelSummaryStep;
