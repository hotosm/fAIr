import { Avatar } from "@/components/ui/avatar/avatar";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { TUser } from "@/types";

export const ProfileOverview = ({ user }: { user: TUser }) => {
  return (
    <section className="flex flex-col md:flex-row items-start gap-y-14 md:gap-y-0 md:items-center md:justify-between">
      <div className="flex  items-center justify-center gap-x-6">
        <div className="p-1 md:p-2 w-24 md:w-40 h-24 md:h-40 border-2 md:border-4 border-primary rounded-full">
          <Avatar
            imageUrl={user?.img_url}
            label={user?.username}
            size="100%"
            className="!w-full !h-full rounded-full border-gray-border"
          />
        </div>
        <div>
          <h1 className="text-title-3 md:text-title-2 font-bold">
            {user.username}
          </h1>
          <small className="text-grey text-body-4 md:text-body-3">
            {USER_PROFILE_PAGE_CONTENT.overview.dateJoinedPrefix}{" "}
            {new Date(user.date_joined ?? new Date()).toLocaleString(
              "default",
              {
                month: "long",
                year: "numeric",
              },
            )}
          </small>
        </div>
      </div>
    </section>
  );
};
