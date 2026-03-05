import { Head } from "@/components/seo";
import MarkdownViewer from "@/components/shared/markdown-render";
import { BackButton, ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon, InfoIcon } from "@/components/ui/icons";
import { DownloadIconNew } from "@/components/ui/icons/download-icon";
import { ToolTip } from "@/components/ui/tooltip";
import { APPLICATION_ROUTES } from "@/constants";
import { ButtonVariant } from "@/enums";

import AccuracyDisplay from "@/features/models/components/accuracy-display";
import {
  BASE_MODELS_DETAIL_DATA,
  TBaseModelDetail,
  TBaseModelVariant,
} from "@/utils/base-model-data";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type TInfoRowConfig = {
  label: string;
  value: string;
  tooltip?: string;
};

type TMetadataItemProps = {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
};

/**
 * Collapsible section component for the right sidebar.
 */
const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="border-b border-gray-border pb-4 mb-4 last:border-b-0">
      <button
        className="flex items-center justify-between w-full text-left cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-body-1 text-dark">{title}</h3>
        <ChevronDownIcon
          className={`w-5 h-5 text-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};

const MetadataItem = ({ label, value, tooltip }: TMetadataItemProps) => (
  <div className="flex items-center gap-x-1">
    <span className="text-grey">{label}: </span>
    <span className="text-dark">{value}</span>
    {tooltip && (
      <ToolTip content={tooltip}>
        <InfoIcon className="w-3.5 h-3.5 text-grey cursor-help" />
      </ToolTip>
    )}
  </div>
);

/**
 * Info row for displaying a label/value pair with an optional info tooltip.
 */
const InfoRow = ({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) => (
  <div className="flex flex-col gap-y-1 py-2 ">
    <div className="flex items-center gap-x-1">
      <span className="text-grey text-body-3">{label}</span>
      {tooltip && (
        <ToolTip content={tooltip}>
          <InfoIcon className="w-3.5 h-3.5 text-grey cursor-help" />
        </ToolTip>
      )}
    </div>
    <p className="text-dark text-body-3 break-words">{value}</p>
  </div>
);

/**
 * Variant display component.
 */
const VariantCard = ({ variant }: { variant: TBaseModelVariant }) => (
  <div className="flex flex-col gap-y-2 py-3 border-b border-gray-border last:border-b-0">
    <div className="flex flex-col gap-y-1">
      <span className="text-grey text-body-3">Name:</span>
      <span className="text-dark text-body-3 font-medium">{variant.name}</span>
    </div>
    <div className="flex flex-col gap-y-1">
      <span className="text-grey text-body-3">Classes:</span>
      <span className="text-dark text-body-3 font-medium">
        {variant.classes}
      </span>
    </div>
    <div className="flex flex-col gap-y-1">
      <span className="text-grey text-body-3">Notes:</span>
      <span className="text-dark text-body-3">{variant.notes}</span>
    </div>
  </div>
);

export const BaseModelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const model: TBaseModelDetail | undefined = useMemo(() => {
    return BASE_MODELS_DETAIL_DATA.find((m) => String(m.id) === id);
  }, [id]);

  useEffect(() => {
    if (!model) {
      navigate(APPLICATION_ROUTES.NOTFOUND, {
        replace: true,
        state: {
          from: APPLICATION_ROUTES.BASE_MODELS_HOME,
          error: "base model not found",
          buttonLabel: "Back to Base Models",
          redirectPath: APPLICATION_ROUTES.BASE_MODELS_HOME,
        },
      });
    }
  }, [model, navigate]);

  const architectureRows: TInfoRowConfig[] = model
    ? [
        { label: "Base Model", value: model.architecture.baseModel },
        { label: "Head", value: model.architecture.head },
        {
          label: "Input",
          value: model.architecture.input,
          tooltip: "Input format used by the model",
        },
        { label: "Tile Size px", value: model.architecture.tileSizePx },
        {
          label: "Processing",
          value: model.architecture.processing,
          tooltip: "Pre-processing steps applied",
        },
        {
          label: "Resize",
          value: model.architecture.resize,
          tooltip: "How images are resized before inference",
        },
        {
          label: "Scaling",
          value: model.architecture.scaling,
          tooltip: "Pixel value normalization method",
        },
        {
          label: "Output",
          value: model.architecture.output,
          tooltip: "Model output format",
        },
        {
          label: "Description",
          value: model.architecture.outputDescription,
          tooltip: "Description of the model output",
        },
      ]
    : [];

  const dataInfoRows: TInfoRowConfig[] = model
    ? [
        {
          label: "Sensor",
          value: model.dataInfo.sensor,
          tooltip: "Type of sensor used to capture imagery",
        },
        {
          label: "CRS",
          value: model.dataInfo.crs,
          tooltip: "Coordinate Reference System",
        },
        {
          label: "Spatial Extent",
          value: model.dataInfo.spatialExtent,
          tooltip: "Geographic coverage of training data",
        },
        {
          label: "Temporal Extent",
          value: model.dataInfo.temporalExtent,
          tooltip: "Time period of training data",
        },
      ]
    : [];

  if (!model) {
    return null;
  }

  return (
    <>
      <Head title={`${model.fullTitle}`} />
      <BackButton className="mt-6" />

      <div className="my-8 flex flex-col gap-y-8">
        {/* Title + Start Mapping */}
        <div className="flex border-b pb-8 flex-col md:flex-row items-start md:items-center justify-between gap-y-4">
          <div className="flex flex-col gap-y-1">
            <h1 className="font-semibold text-title-1 md:text-title-2 text-dark">
              {model.fullTitle}
            </h1>
            <p className="text-grey text-body-3">Model ID: {model.dataId}</p>
          </div>
          <div className="self-start md:self-auto">
            <ButtonWithIcon
              onClick={() =>
                navigate(`${APPLICATION_ROUTES.START_MAPPING_BASE}${model.id}`)
              }
              variant={ButtonVariant.PRIMARY}
              label="Start Mapping"
            />
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-3">
          <div className="flex flex-col gap-y-3">
            <MetadataItem label="Created by" value={model.createdBy} />
            <MetadataItem label="Generated on" value={model.generatedOn} />
            <MetadataItem label="Last Modified" value={model.lastModified} />
          </div>
          <div className="flex flex-col gap-y-3">
            <MetadataItem label="Version" value={model.version} />
            <MetadataItem
              label="Model Weights License"
              value={model.modelWeightsLicense}
            />
            <MetadataItem
              label="Dataset License"
              value={model.datasetLicense}
            />
          </div>
          <div className="flex flex-col gap-y-3">
            <MetadataItem
              label="Task"
              value={model.task}
              tooltip="The ML task this model performs"
            />
            <div className="flex items-center gap-x-2">
              <span className="text-grey">Accuracy: </span>
              <AccuracyDisplay accuracy={model.accuracy} />
            </div>
            <MetadataItem
              label="Data ID"
              value={model.dataId}
              tooltip="Unique dataset identifier"
            />
          </div>
        </div>

        {/* Download Metadata Link */}
        <div>
          <button className="inline-flex items-center gap-x-1 text-primary text-body-3 hover:text-primary transition-colors underline ">
            <span className="">Download Metadata</span>
            <DownloadIconNew className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-x-12 gap-y-10">
          {/* Left Column - Overview */}
          <MarkdownViewer content={model.markdownContent} />

          {/* Right Column - Architecture Info */}
          <div className="bg-frosted-blue border rounded-lg border-gray-border p-6 h-fit sticky top-8">
            <CollapsibleSection title="Architecture Info" defaultOpen={true}>
              <div className="flex flex-col">
                {architectureRows.map((row) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    tooltip={row.tooltip}
                  />
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Variants" defaultOpen={false}>
              <div className="flex flex-col">
                {model.architecture.variants.map((variant, i) => (
                  <VariantCard key={i} variant={variant} />
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Data Info" defaultOpen={false}>
              <div className="flex flex-col">
                {dataInfoRows.map((row) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    tooltip={row.tooltip}
                  />
                ))}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </>
  );
};
