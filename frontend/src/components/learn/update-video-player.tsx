import { SHOELACE_SIZES } from "@/enums";
import useScreenSize from "@/hooks/use-screen-size";
import { TFairVideo } from "@/types";
import { getYouTubeEmbedUrl } from "@/utils";
import { Drawer } from "vaul";
import { Dialog } from "../ui/dialog";
import { CloseIcon } from "../ui/icons";
import { BackChevronIcon } from "../ui/icons/back-chevron";

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

  // Nothing open, nothing mounted, nothing haunting the DOM 👻
  if (!isOpen) return null;

  return (
    <section className="relative">
      {isSmallViewport ? (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />

            <Drawer.Content
              className="
                fixed inset-x-0 bottom-0 z-[1000] mt-24
                flex h-[85vh] flex-col shadow-xl outline-none
              "
            >
              {/* Video */}
              <div className="relative flex-1 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[rgba(44,48,56,0)] to-[#2C3038] backdrop-blur-[2px] p-3 flex items-center gap-3 px-4 pt-4 pb-3 z-50">
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
          <button
            onClick={onClose}
            className="fixed top-24 right-4 md:right-auto md:left-[calc(50%+300px)] lg:left-[calc(50%+370px)] z-[1000] bg-white hover:bg-white/40 backdrop-blur-md rounded-full p-2"
            aria-label="Close modal"
          >
            <CloseIcon className="w-8 h-8 text-hot-fair-color-ink" />
          </button>

          <Dialog
            isOpened={isOpen}
            closeDialog={onClose}
            noHeader
            noPadding
            size={SHOELACE_SIZES.MEDIUM_LARGE}
          >
            <div className="h-[770px] relative">
              <div className="absolute top-0 left-0 right-0 h-[80px] md:h-[90px] bg-gradient-to-b from-[rgba(44,48,56,0)] to-[#2C3038] backdrop-blur-[2px] p-3 md:p-4 flex  gap-y-2">
                <h2 className="text-body-2 md:text-body-1 lg:text-title-3 font-bold text-white line-clamp-2">
                  {video.name}
                </h2>
              </div>

              <iframe
                src={embedUrl}
                title={video.name}
                className="w-full h-full"
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