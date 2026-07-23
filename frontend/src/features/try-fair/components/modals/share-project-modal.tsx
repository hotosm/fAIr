import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Switch } from "@/components/ui/form";
import { CloseIcon, LinkIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { showSuccessToast } from "@/utils";

const shareProjectSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  includeMapOutcome: z.boolean(),
});

type ShareProjectFormValues = z.infer<typeof shareProjectSchema>;

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

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ShareProjectFormValues>({
    resolver: zodResolver(shareProjectSchema),
    defaultValues: {
      email: "",
      includeMapOutcome: true,
    },
  });

  const handleClose = () => {
    reset();
    if (externalCloseDialog) {
      externalCloseDialog();
    } else {
      storeSetIsOpened(false);
    }
  };

  const onSubmit = (data: ShareProjectFormValues) => {
    showSuccessToast(`Invitation sent to ${data.email}`);
    reset({ email: "", includeMapOutcome: data.includeMapOutcome });
  };

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={handleClose}
      noHeader
      borderRadius="rounded"
      size={SHOELACE_SIZES.SMALL}
    >
      <div className="flex flex-col p-1 sm:p-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-border">
          <h3 className="text-sm font-medium text-dark">Share project</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-dark hover:text-gray-600 transition-colors p-1 rounded-lg focus:outline-none"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 pt-4"
        >
          {/* Email input + Invite button */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    handleInput={(e) => field.onChange(e.target.value)}
                    placeholder="Email"
                    className="flex-1"
                    showBorder
                    isValid={errors.email ? false : undefined}
                  />
                )}
              />
              <Button type="submit" rounded className="!w-fit min-w-[80px]">
                Invite
              </Button>
            </div>
            {errors.email && (
              <span className="text-xs text-red-500 font-medium px-1">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Toggle row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-border">
            <div className="flex flex-col pr-4">
              <span className="text-sm font-medium text-dark">
                Include map outcome (Predictions)
              </span>
              <span className="text-xs text-grey mt-0.5">
                Allow user to access the mapping result
              </span>
            </div>

            <Controller
              name="includeMapOutcome"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  handleSwitchChange={(e: any) =>
                    field.onChange(e.target.checked)
                  }
                />
              )}
            />
          </div>

          {/* Bottom Copy Link */}
          <div className="pt-2 flex justify-end">
            <CopyButton
              text={typeof window !== "undefined" ? window.location.href : ""}
              label="Copy Link"
              size="small"
              icon={LinkIcon}
              iconClassName="size-4"
            />
          </div>
        </form>
      </div>
    </Dialog>
  );
};

