import { Avatar } from "@/components/ui/avatar/avatar";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { TUser } from "@/types";

export const ProfileOverview = ({ user }: { user: TUser }) => {
  return (
    <section className="flex flex-col items-start gap-y-14 md:flex-row md:items-center md:justify-between md:gap-y-0">
      <div className="flex  items-center justify-center gap-x-6">
        <div className="size-24 rounded-full border-2 border-primary p-1 md:size-40 md:border-4 md:p-2">
          <Avatar
            imageUrl={user?.img_url}
            label={user?.username}
            size="100%"
            className="!h-full !w-full rounded-full border-gray-border"
          />
        </div>
        <div>
          <h1 className="text-title-3 font-bold md:text-title-2">
            {user.username}
          </h1>
          <small className="text-body-4 text-grey md:text-body-3">
            {USER_PROFILE_PAGE_CONTENT.overview.dateJoinedPrefix}{" "}
            {new Date(user.date_joined).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </small>
        </div>
      </div>
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <h3 className="text-body-4 font-bold md:text-body-3">
            {user.profile_completion_percentage}
            {"%"} {USER_PROFILE_PAGE_CONTENT.overview.profileCompletionSuffix}
          </h3>
          <div className="h-1.5 w-full rounded-xl bg-light-gray">
            <div
              style={{ width: user.profile_completion_percentage + "%" }}
              className="h-1.5 rounded-xl bg-primary"
            ></div>
          </div>
        </div>
        {user.profile_completion_percentage === 100 ? (
          <p className="text-body-4 md:text-body-3">
            {USER_PROFILE_PAGE_CONTENT.overview.profileCompletionSuccess}
          </p>
        ) : (
          <Link
            nativeAnchor={false}
            disableLinkStyle
            title={USER_PROFILE_PAGE_CONTENT.overview.profileCompletionCTA}
            href={APPLICATION_ROUTES.PROFILE_SETTINGS}
            className="inline-flex items-center gap-x-2 text-body-4 font-semibold !text-primary md:text-body-3"
          >
            {USER_PROFILE_PAGE_CONTENT.overview.profileCompletionCTA}
            <span>
              <ChevronDownIcon className="size-3 -rotate-90" />
            </span>
          </Link>
        )}
      </div>
    </section>
  );
};
