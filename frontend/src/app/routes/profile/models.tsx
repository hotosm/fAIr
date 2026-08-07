import { Head } from "@/components/seo";

import { useAuth } from "@/app/providers/auth-provider";

import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { ModelExplorer } from "@/components/shared/model-explorer";

export const UserModelsPage = () => {
  const { user } = useAuth();
  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.models.pageTitle} />
      <ModelExplorer
        title="My Models"
        // createButtonAlt={USER_PROFILE_PAGE_CONTENT.models.createNewButtonText}
        // createRoute={APPLICATION_ROUTES.CREATE_NEW_MODEL}
        userId={user?.osm_id}
      />
    </>
  );
};
