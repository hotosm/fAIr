import { Head } from "@/components/seo";

// import { useAuth } from "@/app/providers/auth-provider";

import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
// import { ModelExplorer } from "@/components/shared/model-explorer";
import { APPLICATION_ROUTES } from "@/constants";
import PageEmptyState from "@/features/user-profile/components/page-empty-state";

export const UserModelsPage = () => {
  // const { user } = useAuth();
  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.models.pageTitle} />
       <div className="w-full  flex flex-col  justify-center items-center  h-4/5">

        <PageEmptyState
          heading="No Datasets Yet"
          subHeading="You have not created any datasets. Get started by creating your first dataset."
          ctaText="Create Dataset"
          ctaHref={APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET}
        />
      </div>
      {/* <ModelExplorer
        title="My Models"
        // createButtonAlt={USER_PROFILE_PAGE_CONTENT.models.createNewButtonText}
        // createRoute={APPLICATION_ROUTES.CREATE_NEW_MODEL}
        userId={user?.osm_id}
      /> */}
    </>
  );
};
