import { useAuth } from "@/app/providers/auth-provider";
import { ModelFormConfirmation } from "@/assets/images";
import { Head } from "@/components/seo";
import { DeleteModal } from "@/components/shared/modals";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Switch } from "@/components/ui/form";
import { CheckIcon, DeleteIcon } from "@/components/ui/icons";
import { Image } from "@/components/ui/image";
import { ToolTip } from "@/components/ui/tooltip";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { ButtonVariant, INPUT_TYPES } from "@/enums";
import { NotificationDeliveryMethod } from "@/enums/user-profile";
import {
  useEmailVerification,
  useUpdateUserProfile,
} from "@/features/user-profile/hooks/use-user-profile";
import { useDialog } from "@/hooks/use-dialog";
import { showErrorToast, showSuccessToast, truncateString } from "@/utils";
import { useState } from "react";

export const UserProfileSettingsPage = () => {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState<string>(user?.email || "");
  const [validity, setValidity] = useState<{ valid: boolean; message: string }>(
    {
      valid: true,
      message: "",
    },
  );

  const [showForm, setShowForm] = useState<boolean>(user?.email.length === 0);

  const [isEmailPending, setIsEmailPending] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<{
    monthlyNewsletter: boolean;
    emailTrainingNotification: boolean;
    webTrainingNotification: boolean;
  }>({
    monthlyNewsletter: user.newsletter_subscription,
    emailTrainingNotification: user.notifications_delivery_methods.includes(
      NotificationDeliveryMethod.MAIL,
    ),
    webTrainingNotification: user.notifications_delivery_methods.includes(
      NotificationDeliveryMethod.WEB,
    ),
  });

  const [isNotificationPending, setIsNotificationPending] =
    useState<boolean>(false);

  const { mutate: updateEmail } = useUpdateUserProfile({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast("Email update successful.");
        setShowForm(false);
        // Update the user object in the context.
        setUser(data);
        setIsEmailPending(false);
      },
      onError: (error) => {
        showErrorToast(error, "Error updating email.");
        setIsEmailPending(false);
      },
    },
  });
  const { isOpened, openDialog, closeDialog } = useDialog();

  const {
    isOpened: isSuccessDialogOpened,
    openDialog: openSuccessDialog,
    closeDialog: closeSuccessDialog,
  } = useDialog();

  const {
    mutate: requestAccountDeletion,
    isPending: accountDeletionRequestIsPending,
  } = useUpdateUserProfile({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast("Account deletion request successful.");
        setUser(data);
        closeDialog();
        openSuccessDialog();
      },
      onError: (error) => {
        showErrorToast(error, "Account deletion request failed.");
      },
    },
  });

  const {
    mutate: requestEmailVerification,
    isPending: emailVerificationRequestIsPending,
  } = useEmailVerification({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast(
          "Email verification instructions has been sent to your email address.",
        );
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const { mutate: updateNotifications } = useUpdateUserProfile({
    mutationConfig: {
      onSuccess: (data) => {
        showSuccessToast("Notifications update successful.");
        setUser(data);
        setIsNotificationPending(false);
      },
      onError: (error) => {
        showErrorToast(error, "Error updating notifications.");
        setIsNotificationPending(false);
      },
    },
  });

  const handleEmailSubmit = () => {
    setIsEmailPending(true);
    updateEmail({ email });
  };

  const handleDeleteAccount = () => {
    requestAccountDeletion({ account_deletion_requested: true });
  };

  return (
    <>
      {/* Delete success dialog */}
      <Dialog isOpened={isSuccessDialogOpened} closeDialog={closeSuccessDialog}>
        <div className="flex flex-col items-center gap-y-4 h-full w-full justify-center">
          <Image
            src={ModelFormConfirmation}
            alt="Model Creation Success Icon"
          />
          <h1 className="text-title-3 font-semibold">
            {
              USER_PROFILE_PAGE_CONTENT.settings.account.deleteModal
                .deletionSuccessTitle
            }
          </h1>
          <p className="text-body-3 text-center">
            {
              USER_PROFILE_PAGE_CONTENT.settings.account.deleteModal
                .deletionSuccessDescription
            }
          </p>
          <div className="flex  w-full items-center justify-center">
            <Button
              onClick={closeSuccessDialog}
              className="md:!w-fit !px-4 py-2"
              contentClassName="md:!px-8"
            >
              {
                USER_PROFILE_PAGE_CONTENT.settings.account.deleteModal
                  .buttonText
              }
            </Button>
          </div>
        </div>
      </Dialog>
      <Head title={USER_PROFILE_PAGE_CONTENT.settings.pageTitle} />
      <DeleteModal
        isOpen={isOpened}
        onClose={closeDialog}
        title={USER_PROFILE_PAGE_CONTENT.settings.account.deleteModal.title}
        messageSuffix={
          USER_PROFILE_PAGE_CONTENT.settings.account.deleteModal.messageSuffix
        }
        onDelete={handleDeleteAccount}
        isDeleting={accountDeletionRequestIsPending}
      />

      <div className="flex justify-center items-center">
        <div className="w-full md:max-w-[400px] flex flex-col gap-y-10">
          {!showForm && (
            <>
              <SectionHeader
                sectionTitle={
                  USER_PROFILE_PAGE_CONTENT.settings.form
                    .emailAddressSectionHeading
                }
              />
              <div className="flex flex-col md:flex-row gap-y-2 md:gap-0 justify-between md:items-center">
                <p className="text-body-3 md:text-body-2 flex items-center gap-x-2">
                  {truncateString(email)}
                  {user.email_verified && (
                    <ToolTip
                      content={
                        USER_PROFILE_PAGE_CONTENT.settings.form
                          .emailVerifiedTooltip
                      }
                    >
                      <span className="w-5 h-5 p-1 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckIcon className="icon text-white" />
                      </span>
                    </ToolTip>
                  )}
                </p>
                <Button
                  variant={ButtonVariant.TERTIARY}
                  onClick={() => setShowForm(true)}
                  uppercase={false}
                  className="!w-fit"
                  contentClassName="md:!p-0.5 text-body-4"
                  size="small"
                >
                  {USER_PROFILE_PAGE_CONTENT.settings.form.editEmail}
                </Button>
              </div>
            </>
          )}

          {showForm && (
            <div className="flex flex-col gap-y-6">
              <SectionHeader
                sectionTitle={
                  USER_PROFILE_PAGE_CONTENT.settings.form.sectionHeading
                }
              />
              <div className="mt-2 flex flex-col space-y-6">
                <Input
                  label={USER_PROFILE_PAGE_CONTENT.settings.form.formLabel}
                  showBorder
                  type={INPUT_TYPES.EMAIL}
                  placeholder={
                    USER_PROFILE_PAGE_CONTENT.settings.form.placeholder
                  }
                  value={email}
                  handleInput={(e) => setEmail(e.target.value)}
                  validationStateUpdateCallback={(e) => setValidity(e)}
                />
                {validity.message && (
                  <small className="text-primary">{validity.message}</small>
                )}
                <Button
                  disabled={
                    !validity.valid || email.length === 0 || isEmailPending
                  }
                  type="submit"
                  onClick={handleEmailSubmit}
                  className="!w-fit"
                  uppercase={false}
                  contentClassName="!px-4 py-2"
                  size="small"
                >
                  {isEmailPending
                    ? USER_PROFILE_PAGE_CONTENT.settings.form
                        .submissionInProgress
                    : USER_PROFILE_PAGE_CONTENT.settings.form.submitButton}
                </Button>
              </div>
            </div>
          )}

          {!user.email_verified && user?.email.length > 0 && (
            <div className="text-sm flex flex-col gap-y-6 h-full bg-off-white rounded-md p-4">
              <p>
                {
                  USER_PROFILE_PAGE_CONTENT.settings.form
                    .emailNotVerifiedMessage
                }
              </p>
              <div className="flex justify-end">
                <Button
                  variant={ButtonVariant.PRIMARY}
                  onClick={() => requestEmailVerification(undefined)}
                  uppercase={false}
                  disabled={emailVerificationRequestIsPending}
                  className="!w-fit"
                  contentClassName="md:!p-0.5 text-body-4"
                  size="small"
                >
                  {
                    USER_PROFILE_PAGE_CONTENT.settings.form
                      .verifyEmailButtonText
                  }
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-y-6">
            <SectionHeader
              sectionTitle={
                USER_PROFILE_PAGE_CONTENT.settings.notifications.sectionTitle
              }
            />
            <div className="mt-2 space-y-4">
              {USER_PROFILE_PAGE_CONTENT.settings.notifications.notificationTypes.map(
                (notification, index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <div
                      className={`flex justify-between items-center transition-opacity duration-200 ${user.email.length === 0 && notification.key !== USER_PROFILE_PAGE_CONTENT.settings.notifications.notificationKeys.webTrainingNotification ? "opacity-50" : ""}`}
                    >
                      <div className="flex flex-col gap-y-1">
                        <h3 className="text-body-3 md:text-body-2">
                          {notification.label}
                        </h3>
                        <p className="text-body-4 md:text-body-3 text-grey">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        disabled={
                          isNotificationPending ||
                          (!user.email_verified &&
                            notification.key !==
                              USER_PROFILE_PAGE_CONTENT.settings.notifications
                                .notificationKeys.webTrainingNotification) ||
                          (user.email.length === 0 &&
                            notification.key !==
                              USER_PROFILE_PAGE_CONTENT.settings.notifications
                                .notificationKeys.webTrainingNotification)
                        }
                        checked={
                          notifications[
                            notification.key as keyof typeof notifications
                          ]
                        }
                        handleSwitchChange={(e) => {
                          const updatedNotifications = {
                            ...notifications,
                            [notification.key]: e.target.checked,
                          };
                          setIsNotificationPending(true);
                          updateNotifications(
                            {
                              newsletter_subscription:
                                updatedNotifications.monthlyNewsletter,
                              notifications_delivery_methods: [
                                ...(updatedNotifications.emailTrainingNotification
                                  ? [NotificationDeliveryMethod.MAIL]
                                  : []),
                                ...(updatedNotifications.webTrainingNotification
                                  ? [NotificationDeliveryMethod.WEB]
                                  : []),
                              ],
                            },
                            {
                              onSuccess: () => {
                                setNotifications(updatedNotifications);
                              },
                              onError: (error) => {
                                showErrorToast(
                                  error,
                                  "Error updating notifications",
                                );
                              },
                            },
                          );
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="flex flex-col gap-y-6">
            <SectionHeader
              sectionTitle={
                USER_PROFILE_PAGE_CONTENT.settings.account.sectionTitle
              }
            />
            <div className="flex flex-col gap-y-6">
              <div className="flex flex-col gap-y-1">
                <p className="text-body-3 md:text-body-2">
                  {USER_PROFILE_PAGE_CONTENT.settings.account.title}
                </p>
                <p className="text-grey text-body-3">
                  {!user.account_deletion_requested
                    ? USER_PROFILE_PAGE_CONTENT.settings.account.description
                    : USER_PROFILE_PAGE_CONTENT.settings.account
                        .deleteRequestPending}
                </p>
              </div>
              <ButtonWithIcon
                label={
                  USER_PROFILE_PAGE_CONTENT.settings.account.deleteButtonText
                }
                variant={ButtonVariant.PRIMARY}
                prefixIcon={DeleteIcon}
                uppercase={false}
                className="!w-fit"
                textClassName="p-0.5 md:px-1 md:py-2 text-body-4"
                onClick={openDialog}
                size="small"
                disabled={user.account_deletion_requested}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SectionHeader = ({ sectionTitle }: { sectionTitle: string }) => {
  return (
    <div>
      <h2 className="text-body-1 md:text-title-4 font-semibold">
        {sectionTitle}
      </h2>
    </div>
  );
};
