import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";

import { Button } from "@/components/ui/button";
import { Input, Switch } from "@/components/ui/form";

import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { ButtonVariant, INPUT_TYPES } from "@/enums";
import {
  useEmailVerification,
  useUpdateUserProfile,
} from "@/features/user-profile/hooks/use-user-profile";

import { showErrorToast, showSuccessToast } from "@/utils";
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

  const [newsletterSubscription, setNewsletterSubscription] = useState<boolean>(
    user.newsletter_subscription,
  );

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

  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.settings.pageTitle} />

      <div className="flex justify-center items-center">
        <div className="w-full md:max-w-[400px] flex flex-col gap-y-10">
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
            <div
              className={`mt-2 flex justify-between items-center transition-opacity duration-200 ${user.email.length === 0 ? "opacity-50" : ""}`}
            >
              <div className="flex flex-col gap-y-1">
                <h3 className="text-body-3 md:text-body-2">
                  {
                    USER_PROFILE_PAGE_CONTENT.settings.notifications.newsletter
                      .label
                  }
                </h3>
                <p className="text-body-4 md:text-body-3 text-grey">
                  {
                    USER_PROFILE_PAGE_CONTENT.settings.notifications.newsletter
                      .description
                  }
                </p>
              </div>
              <Switch
                disabled={
                  isNotificationPending ||
                  !user.email_verified ||
                  user.email.length === 0
                }
                checked={newsletterSubscription}
                handleSwitchChange={(e) => {
                  const subscribed = e.target.checked;
                  setIsNotificationPending(true);
                  updateNotifications(
                    { newsletter_subscription: subscribed },
                    {
                      onSuccess: () => setNewsletterSubscription(subscribed),
                    },
                  );
                }}
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
