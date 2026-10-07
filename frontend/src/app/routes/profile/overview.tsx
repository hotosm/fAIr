import { Head } from "@/components/seo";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import {
  AdvancedOverview,
  BasicOverview,
} from "@/features/user-profile/components/overview";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";

export const UserProfileOverviewPage = () => {
  const { mappingMode } = useTryFairParams();

  return (
    <>
      <Head title={USER_PROFILE_PAGE_CONTENT.overview.pageTitle} />
      <div className="">
        {mappingMode === "advanced" ? <AdvancedOverview /> : <BasicOverview />}
      </div>
    </>
  );
};
