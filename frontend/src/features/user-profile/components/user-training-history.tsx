import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { ProfileSectionHeader } from "./profile-section-header";
import { TrainingHistoryTable } from "@/features/models/components";

export const UserTrainingHistory = () => {
  return (
    <section>
      <ProfileSectionHeader
        title={USER_PROFILE_PAGE_CONTENT.overview.trainingsSectionTitle}
      />
      <TrainingHistoryTable showUserTrainingHistory />
    </section>
  );
};
