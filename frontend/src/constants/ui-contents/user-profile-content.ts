import { TUserProfilePageContent } from "@/types";

export const USER_PROFILE_PAGE_CONTENT: TUserProfilePageContent = {
  overview: {
    pageTitle: "My Profile",
    dateJoinedPrefix: "Joined",
    profileCompletionSuffix: "Complete",
    profileCompletionCTA: "Complete your profile",
    profileCompletionSuccess: "Your profile is complete 🎉",
    trainingsSectionTitle: "My Trainings",
    statistics: {
      modelsCreated: "Models Created",
      acceptedFeaturesTitle: "Accepted Features",
      datasets: "Datasets",
      feedbacks: "Feedbacks",
    },
  },
  models: {
    pageTitle: "My Models",
    sectionTitle: "My Models",
    createNewButtonText: "Create New",
  },
  datasets: {
    pageTitle: "My Datasets",
    sectionTitle: "My Datasets",
  },
  settings: {
    pageTitle: "Profile Settings",
    form: {
      sectionHeading: "Enter email address",
      emailAddressSectionHeading: "Email Address",
      placeholder: "Enter email address",
      formLabel: "Email",
      editEmail: "Change email",
      submitButton: "Submit",
      submissionInProgress: "Submitting...",
      emailVerifiedTooltip: "Email verified",
      emailNotVerifiedMessage:
        "Please verify your email address to receive notifications.",
      verifyEmailButtonText: "Verify Email",
    },
    notifications: {
      sectionTitle: "Notifications",
      notificationKeys: {
        monthlyNewsletter: "monthlyNewsletter",
        emailTrainingNotification: "emailTrainingNotification",
        webTrainingNotification: "webTrainingNotification",
      },
      notificationTypes: [
        {
          label: "Monthly Newsletter",
          key: "monthlyNewsletter",
          description: "Subscribe to our monthly newsletter.",
        },
        {
          label: "Email Training Notification",
          key: "emailTrainingNotification",
          description: "Receive model training notifications via email.",
        },
        {
          label: "Web Training Notification",
          key: "webTrainingNotification",
          description: "Receive model training notifications via fAIr web.",
        },
      ],
    },
    account: {
      sectionTitle: "Account",
      title: "Delete Account",
      description:
        "If you no longer want to use fAIr, request to delete your account.",
      deleteRequestPending:
        "⚠️ Your request to delete your account is pending.",
      deleteButtonText: "Delete My Account",
      deleteModal: {
        title: "Delete Account",
        messageSuffix: "your account",
        deletionSuccessTitle: "Delete Request Sent",
        deletionSuccessDescription:
          "We have received the request to delete your account, a member of our team would be in touch with you.",
        buttonText: "Done",
      },
    },
  },
  notifications: {
    panelTitle: "Notifications",
    all: "All",
    unread: "Unread",
    markAllAsRead: "Mark all as read",
    markAsRead: "Mark as read",
    emptyState: "No new notifications.",
    errorState: "Failed to fetch notifications.",
    toolTip: "Notifications",
  },
};
