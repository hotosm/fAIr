import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { ToolTip } from "@/components/ui/tooltip";
import { HistoryIcon } from "@/components/ui/icons/refresh-icon";

export function PredictionHistoryButton() {
  const open = useStartMappingStore((state) => state.showPredictionHistory);
  const setOpen = useStartMappingStore(
    (state) => state.setShowPredictionHistory,
  );
  return (
    <ToolTip content="Prediction History">
      <button
        type="button"
        aria-label="Prediction History"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="prediction-history"
        onClick={() => setOpen(!open)}
        className={
          open
            ? "flex rounded-md items-center bg-light-gray p-1 text-dark hover:text-primary"
            : "flex items-center  p-1 text-dark hover:text-primary"
        }
      >
        <HistoryIcon />
      </button>
    </ToolTip>
  );
}
