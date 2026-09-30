import { Head } from "@/components/seo";
// import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
// import { APPLICATION_ROUTES } from "@/constants";
// import PageEmptyState from "@/features/user-profile/components/page-empty-state";
// import { ProfileSectionHeader } from "@/features/user-profile/components";
import { ModelExplorer } from "@/components/shared/model-explorer";
import { useAuth } from "@/app/providers/auth-provider";

export const UserModelsPage = () => {
  const { user } = useAuth();
  return (
    <>
      <Head title={"Models"} />
      {/* <ProfileSectionHeader
              title={USER_PROFILE_PAGE_CONTENT.datasets.sectionTitle}
            /> */}

      <ModelExplorer
        title="My Models"
        // createButtonAlt={USER_PROFILE_PAGE_CONTENT.models.createNewButtonText}
        // createRoute={APPLICATION_ROUTES.CREATE_NEW_MODEL}
        userId={user?.osm_id}
      />
    </>
  );
};
