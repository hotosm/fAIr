import { SHOELACE_SIZES } from "@/enums";
import useScreenSize from "@/hooks/use-screen-size";
import { TFairVideo } from "@/types";
import { getYouTubeEmbedUrl } from "@/utils";
import { Drawer } from "vaul";
import { Dialog } from "@/components/ui/dialog";
import { BackChevronIcon } from "@/components/ui/icons/back-chevron";

export const VideoPlayerModal = ({
  video,
  onClose,
  isOpen,
}: {
  video: TFairVideo;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const embedUrl = getYouTubeEmbedUrl(video.url);
  const { isSmallViewport } = useScreenSize();

  if (!isOpen) return null;

  return (
    <section className="relative">
      {isSmallViewport ? (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
            <Drawer.Title title={video.name} />
            <Drawer.Content
              className="
                fixed inset-x-0 bottom-0 z-[1000] mt-24
                flex h-[75vh] flex-col outline-none
              "
            >
              <div className="relative flex-1 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b to-[rgba(44,48,56,0)] via-[rgba(44,48,56,0.5)] from-[rgba(44,48,56,0.9)] backdrop-blur-[2px] p-3 flex items-center gap-3 px-4 pt-4 pb-3 z-50">
                  <button onClick={onClose} aria-label="Close video">
                    <BackChevronIcon className="h-5 w-5 text-white" />
                  </button>

                  <h2 className="text-sm font-semibold text-white line-clamp-2">
                    {video.name}
                  </h2>
                </div>
                <iframe
                  src={embedUrl}
                  title={video.name}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <>
          <Dialog
            isOpened={isOpen}
            closeDialog={onClose}
            label={video.name}
            noPadding
            size={SHOELACE_SIZES.LARGE}
          >
            <div className="relative aspect-video">
              <iframe
                src={embedUrl}
                title={video.name}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </Dialog>
        </>
      )}
    </section>
  );
};
