import { InfoIcon } from "@/components/ui/icons";

/** Why the Map button is turned off for lack of a model. */
export type MapUnavailableReason = "no-samples" | "no-model-for-feature";

/**
 * Tells the user why Map is disabled when the chosen feature has no model,
 * and points them to the model picker to choose another. ("No samples" has no
 * notice: the model picker says so itself.)
 */
export const MapUnavailableNotice = ({
  featureLabel,
  onOpenModelPicker,
}: {
  featureLabel: string;
  onOpenModelPicker?: () => void;
}) => {
  const title = `No model for ${featureLabel} yet`;
  const body =
    "There's no model available for this feature yet, so Map is turned off. Choose another feature to map.";
  return (
    <div
      role="status"
      className="flex gap-2 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] p-3 text-xs text-dark"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#B54708]" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        <p className="text-grey">{body}</p>
        {onOpenModelPicker && (
          <button
            type="button"
            onClick={onOpenModelPicker}
            className="mt-1 w-fit font-medium text-primary underline"
          >
            Open model picker
          </button>
        )}
      </div>
    </div>
  );
};
