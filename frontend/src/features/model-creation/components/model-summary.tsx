import {
  DatabaseIcon,
  MapIcon,
  RAMIcon,
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
  const summaryData = [
    { icon: TagsIcon, label: "Model Name", content: "San Jose Test Model" },
    {
      icon: TextIcon,
      label: "Model Description",
      content:
        "Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
    },
    { icon: DatabaseIcon, label: "Base Model", content: "RAMP" },
    { icon: TagsIcon, label: "Dataset Name", content: "San Jose Buildings" },
    { icon: SaveIcon, label: "Dataset ID", content: "237" },
    { icon: RAMIcon, label: "Dataset Size", content: "250 Images" },
    {
      icon: MapIcon,
      label: "Open Aerial Imagery",
      content: "San Jose Mission 10C Flight 1",
    },
    { icon: ZoomInIcon, label: "Zoom Levels", content: ["Zoom 21", "Zoom 22"] },
    {
      icon: SettingsIcon,
      label: "Training Settings",
      content: [
        "Epoch: 21",
        "Batch Size: 23",
        "Contact Spacing: 23",
        "Boundary Width: 23",
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
