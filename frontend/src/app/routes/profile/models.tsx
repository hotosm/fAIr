import { Head } from "@/components/seo";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { ProfileSectionHeader } from "@/features/user-profile/components";
import PageEmptyState from "@/features/user-profile/components/page-empty-state";

export const UserModelsPage = () => (
  <>
    <Head title={USER_PROFILE_PAGE_CONTENT.models.pageTitle} />
    <ProfileSectionHeader
      title={USER_PROFILE_PAGE_CONTENT.models.sectionTitle}
    />
    <div className="w-full flex flex-col justify-center items-center min-h-[360px] py-12">
      <PageEmptyState
        heading="Coming soon"
        subHeading="Creating and managing your own models is coming soon."
      />
    </div>
  </>
);
