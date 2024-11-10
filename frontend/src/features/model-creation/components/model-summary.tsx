import { useModelsContext } from "@/app/providers/models-provider";
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
import { MODEL_CREATION_CONTENT } from "@/utils";

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

const ModelSummaryForm = () => {
  const { formData } = useModelsContext();
  const summaryData = [
    { icon: TagsIcon, label: "Model Name", content: formData.modelName },
    {
      icon: TextIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.modelDescription,
      content: formData.modelDescription,
    },
    {
      icon: DatabaseIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.baseModel,
      content: formData.baseModel.toUpperCase(),
    },
    { icon: TagsIcon, label: "Dataset Name", content: formData.datasetName },
    {
      icon: SaveIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.datasetId,
      content: formData.selectedTrainingDatasetId,
    },
    {
      icon: MapIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.openAerialImagery,
      content: formData.oamTileName,
    },
    {
      icon: ZoomInIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.zoomLevels,
      content: formData.zoomLevels.map((level) => `Zoom ${level}`),
    },
    {
      icon: SettingsIcon,
      label: MODEL_CREATION_CONTENT.modelSummary.form.trainingSettings,
      content: [
        `${MODEL_CREATION_CONTENT.trainingSettings.form.epoch.label}: ${formData.epoch}`,
        `${MODEL_CREATION_CONTENT.trainingSettings.form.batchSize.label}: ${formData.batchSize}`,
        `${MODEL_CREATION_CONTENT.trainingSettings.form.contactSpacing.label}: ${formData.contactSpacing}`,
        `${MODEL_CREATION_CONTENT.trainingSettings.form.boundaryWidth.label}:  ${formData.boundaryWidth}`,
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading={MODEL_CREATION_CONTENT.trainingSettings.pageTitle}
        description={MODEL_CREATION_CONTENT.trainingSettings.pageDescription}
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

export default ModelSummaryForm;
