import { CloseIcon } from "@/components/ui/icons";

type TryFairBannerProps = {
  mapClickCount: number;
  onDismiss: () => void;
};

export const TryFairBanner = ({
  mapClickCount,
  onDismiss,
}: TryFairBannerProps) => {
  const isSecondRun = mapClickCount >= 4;

  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-border shadow-lg p-4 w-[260px] animate-fade-in">
      <div className="flex-1 min-w-0">
        {isSecondRun ? (
          <>
            <p className="text-dark font-semibold text-sm">Take it further</p>
            <p className="text-grey text-xs mt-1 leading-relaxed">
              Export your results and access advanced mapping tools.
            </p>
          </>
        ) : (
          <>
            <p className="text-dark font-semibold text-sm">
              Want more results?
            </p>
            <p className="text-grey text-xs mt-1 leading-relaxed">
              Try adjusting confidence or resolution — small changes can reveal
              more features.
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-grey hover:text-dark shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
