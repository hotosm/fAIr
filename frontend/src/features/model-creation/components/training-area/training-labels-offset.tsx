import { Input } from "@/components/ui/form";
import {
  CheckIcon,
  ChevronDownIcon,
  DirectionIcon,
  ResetIcon,
} from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { OFFSET_STEP } from "@/config";
import { SHOELACE_SIZES, ToolTipPlacement } from "@/enums";
import useDebounce from "@/hooks/use-debounce";
import { useEffect, useMemo, useState } from "react";
import { useUpdateTrainingDataset } from "@/features/model-creation/hooks/use-training-datasets";
import { showErrorToast, showSuccessToast } from "@/utils";
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const DirectionalButton = ({
  positionClasses,
  icon,
  tooltip,
  onClick,
  isDiv = false,
  iconClass = "text-xl",
  disabled = false,
  toolTipPlacement = ToolTipPlacement.TOP,
}: {
  positionClasses: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  isDiv?: boolean;
  iconClass?: string;
  disabled?: boolean;
  toolTipPlacement?: ToolTipPlacement;
}) => {
  const ButtonWrapper = isDiv ? "div" : "button";
  return (
    <ToolTip content={tooltip} placement={toolTipPlacement}>
      <ButtonWrapper
        className={`${positionClasses} flex items-center justify-center hover:bg-hover-accent   ${disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-90"} `}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={iconClass}>{icon}</span>
      </ButtonWrapper>
    </ToolTip>
  );
};

export const TrainingLabelsOffset = ({
  trainingDatasetOffset,
  setTrainingDatasetOffset,
  handleOffsetReset,
  initialOffset,
}: {
  trainingDatasetOffset: { x: number; y: number };
  setTrainingDatasetOffset: (offset: { x: number; y: number }) => void;
  handleOffsetReset: () => void;
  initialOffset: { x: number; y: number };
}) => {
  const { handleChange, formData } = useModelsContext();
  /**
   * State to control the visibility of the offset controller.
   */
  const [showOffsetController, setShowOffsetController] =
    useState<boolean>(false);

  /**
   * Local state to manage the input value for the offset.
   * This is used to debounce the input value before updating the offset.
   */
  const [localInput, setLocalInput] = useState<string>(
    `${trainingDatasetOffset.x.toFixed(2)}, ${trainingDatasetOffset.y.toFixed(2)}`,
  );

  /**
   * Debounce the input value to avoid excessive state updates.
   */
  const debouncedInput = useDebounce(localInput, 500);

  /**
   * Update the local input value when the training dataset offset changes.
   */
  useEffect(() => {
    if (disabled || debouncedInput === "") return;
    const input = debouncedInput.replace(/[^0-9.,-]/g, "");
    const [xRaw, yRaw] = input.split(",");
    const x = Number(parseFloat(xRaw).toFixed(2));
    const y = Number(parseFloat(yRaw).toFixed(2));

    if (!isNaN(x) && !isNaN(y)) {
      setTrainingDatasetOffset({ x, y });
    }
  }, [debouncedInput]);

  /**
   * Update the offset values when the user clicks on the directional buttons.
   * @param newX - The new X offset value.
   * @param newY - The new Y offset value.
   */
  const updateOffset = (newX: number, newY: number) => {
    setTrainingDatasetOffset({ x: newX, y: newY });
    setLocalInput(`${newX.toFixed(2)}, ${newY.toFixed(2)}`);
  };

  const { mutate, isPending } = useUpdateTrainingDataset({
    mutationConfig: {
      onSuccess: (data) => {
        // Update local input with the new offset values.
        setLocalInput(`${data.offset[0]}, ${data.offset[1]}`);
        handleChange(MODEL_CREATION_FORM_NAME.DATASET_OFFSET, [
          data.offset[0],
          data.offset[1],
        ]);
        showSuccessToast("Offset saved successfully.");
      },
      onError: (error) => {
        // Reset the local input to the previous offset values.
        handleOffsetReset();
        showErrorToast(error);
      },
    },
  });

  /**
   * Handle the save offset action when the user clicks on the save button.
   */
  const handleSaveOffset = () => {
    const [xRaw, yRaw] = localInput.split(",");
    const x = Number(parseFloat(xRaw).toFixed(2));
    const y = Number(parseFloat(yRaw).toFixed(2));
    mutate({
      id: Number(formData.selectedTrainingDatasetId),
      offset: [x, y],
    });
  };

  const disabled = useMemo(
    () =>
      (trainingDatasetOffset.x === initialOffset.x &&
        trainingDatasetOffset.y === initialOffset.y &&
        localInput ===
        `${initialOffset.x.toFixed(2)}, ${initialOffset.y.toFixed(2)}`) ||
      isPending,
    [trainingDatasetOffset, initialOffset, localInput, isPending],
  );

  return (
    <div className="bg-white p-2 lg:p-4 min-h-16 h-auto flex flex-col gap-y-4 rounded-lg transition-all duration-200 ease-in-out">
      {/* Toggle Button */}
      <button
        tabIndex={0}
        onClick={() => setShowOffsetController(!showOffsetController)}
        onKeyDown={(e) =>
          e.key === "Enter" && setShowOffsetController(!showOffsetController)
        }
        className="font-semibold text-sm flex items-center justify-between gap-x-2 p-2 rounded hover:bg-hover-accent transition"
      >
        <span>Imagery Offset</span>
        <ChevronDownIcon
          className={`icon transition-transform duration-300 ${showOffsetController ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {/* Offset Controller Panel */}
      {showOffsetController && (
        <div className="max-w-sm mx-auto rounded-xl border space-y-6 p-4">
          <p className="text-start text-dark text-sm">
            Adjust the fetched training labels offset, or enter the offset
            values in meters.
          </p>

          <div className="rounded-lg p-2 bg-gray-border">
            <div className="bg-white rounded-lg relative flex items-center justify-center h-40 xl:p-2">
              <div className="relative w-full h-full bg-white rounded-lg p-1 flex items-center justify-center">
                <DirectionalButton
                  positionClasses="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-10"
                  icon={
                    <DirectionIcon className="size-3 text-dark -rotate-90" />
                  }
                  tooltip="Move Up"
                  onClick={() => {
                    updateOffset(
                      trainingDatasetOffset.x,
                      trainingDatasetOffset.y + OFFSET_STEP,
                    );
                  }}
                />

                <DirectionalButton
                  positionClasses="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-12"
                  icon={
                    <DirectionIcon className="size-3 text-dark -rotate-180" />
                  }
                  tooltip="Move Left"
                  toolTipPlacement={ToolTipPlacement.LEFT}
                  onClick={() => {
                    updateOffset(
                      trainingDatasetOffset.x - OFFSET_STEP,
                      trainingDatasetOffset.y,
                    );
                  }}
                />

                <DirectionalButton
                  positionClasses="absolute top-1/2 right-0 -translate-y-1/2 w-10 h-12"
                  icon={<DirectionIcon className="size-3 text-dark" />}
                  tooltip="Move Right"
                  toolTipPlacement={ToolTipPlacement.RIGHT}
                  onClick={() => {
                    updateOffset(
                      trainingDatasetOffset.x + OFFSET_STEP,
                      trainingDatasetOffset.y,
                    );
                  }}
                />

                <DirectionalButton
                  positionClasses="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-10"
                  icon={
                    <DirectionIcon className="size-3 text-dark rotate-90" />
                  }
                  tooltip="Move Down"
                  toolTipPlacement={ToolTipPlacement.BOTTOM}
                  onClick={() => {
                    updateOffset(
                      trainingDatasetOffset.x,
                      trainingDatasetOffset.y - OFFSET_STEP,
                    );
                  }}
                  isDiv
                />

                <DirectionalButton
                  positionClasses="absolute bottom-1 left-1 p-1 rounded"
                  icon={
                    <ResetIcon
                      className={`icon  ${disabled ? "text-gray-border" : "text-dark"}`}
                    />
                  }
                  tooltip="Reset Offset"
                  onClick={() => {
                    handleOffsetReset();
                    setLocalInput(
                      `${initialOffset.x.toFixed(2)}, ${initialOffset.y.toFixed(2)}`,
                    );
                  }}
                  iconClass="text-red-500 text-xl"
                  disabled={disabled}
                />

                <DirectionalButton
                  positionClasses="absolute bottom-1 right-1 p-1 rounded"
                  icon={
                    <CheckIcon
                      className={`icon  ${disabled ? "text-gray-border" : "text-primary"}`}
                    />
                  }
                  tooltip="Save Offset"
                  onClick={handleSaveOffset}
                  disabled={disabled}
                />

                <div className="bg-gray-border p-2 rounded-lg">
                  <Input
                    size={SHOELACE_SIZES.SMALL}
                    value={localInput}
                    handleInput={(e) => {
                      setLocalInput(e.target.value);
                    }}
                    className="w-28"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
