import { Head } from "@/components/seo";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import {
  ProfileStatistics,
  UserTrainingHistory,
} from "@/features/user-profile/components";

export const UserProfileOverviewPage = () => {
  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.overview.pageTitle} />
      <div className="flex flex-col gap-y-10">
        <ProfileStatistics />
        <UserTrainingHistory />
      </div>
    </>
  );
};
