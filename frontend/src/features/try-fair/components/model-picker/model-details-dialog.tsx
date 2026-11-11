import { Dialog } from "@/components/ui/dialog";
import { StarredIcon } from "@/components/ui/icons/starred-icon";
import { SHOELACE_SIZES } from "@/enums";
import { getInferenceParams } from "@/features/try-fair/api/stac";
import {
  ExperimentalModelBadge,
  getFeatureIcon,
} from "@/features/try-fair/components/model-picker/model-picker-badges";
import type { APIBaseModelItem } from "@/features/try-fair/types/data-types";
import { getModelOutputType } from "@/features/try-fair/utils/common";

const formatDay = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

const humanize = (value: string) =>
  value.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const Fact = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="min-w-0">
      <dt className="text-xs text-grey">{label}</dt>
      <dd className="truncate text-sm text-dark" title={value}>
        {value}
      </dd>
    </div>
  ) : null;

/**
 * Everything worth knowing about a model before choosing it: description,
 * specs, keywords and its default prediction settings. "Use this model"
 * selects it the same way clicking its card does.
 */
export const ModelDetailsDialog = ({
  model,
  source,
  isSelected,
  onClose,
  onUseModel,
}: {
  /** The model to show; null keeps the dialog closed. */
  model: APIBaseModelItem | null;
  source: "base" | "local";
  isSelected: boolean;
  onClose: () => void;
  onUseModel: (model: APIBaseModelItem) => void;
}) => {
  const properties = model?.stac.properties;
  const category = properties?.["fair:category"] ?? model?.category ?? "";
  const FeatureIcon = getFeatureIcon(category);
  // Some models have no hyperparameters recorded; show no settings then.
  const params = properties?.["mlm:hyperparameters"]
    ? getInferenceParams(model!.stac)
    : [];
  // The producer is the provider with the STAC "producer" role.
  const producers =
    properties?.providers?.filter((provider) =>
      provider.roles?.includes("producer"),
    ) ?? [];

  return (
    <Dialog
      isOpened={model !== null}
      closeDialog={onClose}
      label="Model details"
      size={SHOELACE_SIZES.MEDIUM}
    >
      {model && properties && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-dark">
              {properties.title || model.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded bg-grey px-2 py-1 text-xs capitalize leading-none text-white">
                  <FeatureIcon className="size-3" aria-hidden="true" />
                  {category.replace(/[-_]/g, " ")}
                </span>
              )}
              {model.is_pinned && (
                <span className="rounded border border-primary bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Pinned
                </span>
              )}
              <ExperimentalModelBadge category={category} />
              <span className="flex items-center gap-1 text-xs text-grey">
                <StarredIcon />({model.star_count})
              </span>
            </div>
          </div>

          {properties.description && (
            <p className="text-sm leading-relaxed text-grey">
              {properties.description}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-gray-white p-4">
            <Fact label="Model ID" value={model.stac_item_id} />
            <Fact
              label="Type"
              value={source === "base" ? "Base model" : "Local model"}
            />
            {producers.length > 0 && (
              <div className="min-w-0">
                <dt className="text-xs text-grey">Producer</dt>
                <dd className="truncate text-sm text-dark">
                  {producers.map((producer, index) => (
                    <span key={producer.name}>
                      {index > 0 && ", "}
                      {producer.url ? (
                        <a
                          href={producer.url}
                          target="_blank"
                          rel="noreferrer"
                          title={producer.description ?? producer.name}
                          className="underline hover:text-primary"
                        >
                          {producer.name}
                        </a>
                      ) : (
                        producer.name
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <Fact label="Published by" value={model.user?.username} />
            <Fact label="Architecture" value={properties["mlm:architecture"]} />
            <Fact label="Framework" value={properties["mlm:framework"]} />
            <Fact
              label="Tasks"
              value={properties["mlm:tasks"]?.map(humanize).join(", ")}
            />
            <Fact
              label="Output"
              value={
                properties.keywords
                  ? humanize(String(getModelOutputType(model.stac)))
                  : null
              }
            />
            <Fact
              label="Recommended zoom"
              value={
                properties["fair:recommended_zoom"] != null
                  ? String(properties["fair:recommended_zoom"])
                  : null
              }
            />
            <Fact label="Created" value={formatDay(model.created_at)} />
            <Fact label="Updated" value={formatDay(model.last_modified)} />
          </dl>

          {(properties.keywords?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-grey">Keywords</h4>
              <ul className="flex flex-wrap gap-2">
                {properties.keywords.map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-full bg-light-gray px-2.5 py-1 text-xs text-dark"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {params.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-grey">Default prediction settings</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {params.map(({ key, spec }) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="truncate text-grey">{humanize(key)}</dt>
                    <dd className="text-dark">{String(spec.default)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-off-white px-5 py-2.5 text-sm text-dark hover:bg-[#E5E4E4]"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSelected}
              onClick={() => onUseModel(model)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm text-white hover:bg-[#dd5f60] disabled:cursor-not-allowed disabled:bg-[#E3E5E8]"
            >
              {isSelected ? "In use" : "Use this model"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
