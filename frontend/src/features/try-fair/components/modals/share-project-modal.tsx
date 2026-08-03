import Dialog from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import { CloseIcon, InfoIcon, LinkIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { CheckIcon } from "@/components/ui/icons";

interface ShareProjectModalProps {
  isOpened?: boolean;
  closeDialog?: () => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpened: externalIsOpened,
  closeDialog: externalCloseDialog,
}) => {
  const storeIsOpened = useStartMappingStore((state) => state.showShareModal);
  const storeSetIsOpened = useStartMappingStore(
    (state) => state.setShowShareModal,
  );

  const isOpened = externalIsOpened ?? storeIsOpened;
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleClose = () => {
    if (externalCloseDialog) {
      externalCloseDialog();
    } else {
      storeSetIsOpened(false);
    }
  };

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={handleClose}
      noHeader
      borderRadius="rounded"
      size={SHOELACE_SIZES.SMALL}
    >
      <div className="flex flex-col p-1 sm:p-2 gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-border">
          <div className="flex items-center gap-2">
            <LinkIcon className="size-4 text-dark" />
            <h3 className="text-sm font-semibold text-dark">Share</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-dark hover:text-gray-600 transition-colors p-1 rounded-lg focus:outline-none"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {/* URL preview pill */}
        <div className="flex items-center gap-2 bg-[#F5F5F5] border border-gray-border rounded-lg px-3 py-2.5 min-w-0">
          <LinkIcon className="size-3.5 text-grey shrink-0" />
          <span className="text-xs text-grey truncate flex-1 font-mono select-all">
            {currentUrl}
          </span>
        </div>

        {/* Copy button */}
        <Button
          type="button"
          size="medium"
          rounded
          className="w-full flex items-center justify-center gap-2"
          fontSize="13px"
          onClick={() => copyToClipboard(currentUrl)}
        >
          {isCopied ? (
            <>
              <CheckIcon className="size-4" />
              Link copied!
            </>
          ) : (
            <>
              <LinkIcon className="size-4" />
              Copy link
            </>
          )}
        </Button>

        {/* Info note */}
        <div className="flex items-start gap-2 text-grey">
          <InfoIcon className="size-3.5 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Anyone with this link can open the same session — model, imagery,
            resolution and parameters will all be restored.
          </p>
        </div>
      </div>
    </Dialog>
  );
};
