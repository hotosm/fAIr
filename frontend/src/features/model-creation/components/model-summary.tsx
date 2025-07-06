import { BASE_MODELS } from "@/enums";
import { IconProps } from "@/types";
import { MODELS_CONTENT } from "@/constants";
import { StepHeading } from "@/features/model-creation/components/";
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

const SummaryItem = ({
  icon: Icon,
  label,
  content,
}: {
  content: string | string[];
  label: string;
  icon: React.ComponentType<IconProps>;
}) => (
  <div className="flex items-center gap-4">
    <Icon className="icon-lg text-primary" />
    <div>
      <p className="text-grey">{label}</p>
      {Array.isArray(content) ? (
        <div className="flex flex-col gap-x-4 md:flex-row md:items-center">
          {content.map((item, index) => (
            <p key={index} className="text-body-3 text-dark">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-body-3 text-dark">{content}</p>
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
      label: MODELS_CONTENT.modelCreation.modelSummary.form.modelDescription,
      content: formData.modelDescription,
    },
    {
      icon: DatabaseIcon,
      label: MODELS_CONTENT.modelCreation.modelSummary.form.baseModel,
      content: formData.baseModel.toUpperCase(),
    },
    { icon: TagsIcon, label: "Dataset Name", content: formData.datasetName },
    {
      icon: SaveIcon,
      label: MODELS_CONTENT.modelCreation.modelSummary.form.datasetId,
      content: formData.selectedTrainingDatasetId,
    },
    {
      icon: MapIcon,
      label: MODELS_CONTENT.modelCreation.modelSummary.form.openAerialImagery,
      content: formData.datasetName,
    },
    {
      icon: ZoomInIcon,
      label: MODELS_CONTENT.modelCreation.modelSummary.form.zoomLevels,
      content: formData.zoomLevels.map((level) => `Zoom ${level}`),
    },
    {
      icon: SettingsIcon,
      label: MODELS_CONTENT.modelCreation.modelSummary.form.trainingSettings,
      content: [
        `${MODELS_CONTENT.modelCreation.trainingSettings.form.epoch.label}: ${formData.epoch}`,
        `${MODELS_CONTENT.modelCreation.trainingSettings.form.batchSize.label}: ${formData.batchSize}`,
        formData.baseModel === BASE_MODELS.RAMP
          ? `${MODELS_CONTENT.modelCreation.trainingSettings.form.contactSpacing.label}: ${formData.contactSpacing}`
          : "",
        formData.baseModel === BASE_MODELS.RAMP
          ? `${MODELS_CONTENT.modelCreation.trainingSettings.form.boundaryWidth.label}:  ${formData.boundaryWidth}`
          : "",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-y-6">
      <StepHeading
        heading={MODELS_CONTENT.modelCreation.modelSummary.pageTitle}
        description={MODELS_CONTENT.modelCreation.modelSummary.pageDescription}
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
