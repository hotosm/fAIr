import {
  BotIcon,
  DatabaseIcon,
  FeedbackIcon,
  ProductionCheckmarkIcon,
} from "@/components/ui/icons";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { IconProps } from "@/types";
import { FC } from "react";
import { useAuth } from "@/app/providers/auth-provider";

type TProfileStatsItems = {
  stat: number;
  label: string;
  icon: FC<IconProps>;
}[];

export const ProfileStatistics = () => {
  const { user } = useAuth();

  const profileStatsItems: TProfileStatsItems = [
    {
      stat: user.models_count,
      icon: BotIcon,
      label: USER_PROFILE_PAGE_CONTENT.overview.statistics.modelsCreated,
    },
    {
      stat: user.approved_predictions_count,
      icon: ProductionCheckmarkIcon,
      label:
        USER_PROFILE_PAGE_CONTENT.overview.statistics.acceptedFeaturesTitle,
    },
    {
      stat: user.datasets_count,
      icon: DatabaseIcon,
      label: USER_PROFILE_PAGE_CONTENT.overview.statistics.datasets,
    },
    {
      stat: user.feedbacks_count,
      icon: FeedbackIcon,
      label: USER_PROFILE_PAGE_CONTENT.overview.statistics.feedbacks,
    },
  ];

  return (
    <section className="size-full rounded-xl bg-frosted-blue md:h-40">
      <div className="flex size-full flex-col items-center justify-center gap-y-8 p-4 md:flex-row md:justify-around md:gap-y-0">
        {profileStatsItems.map((stat) => (
          <div className="flex h-24 w-48 items-center gap-x-3" key={stat.label}>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary">
              <stat.icon className="size-8 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-title-2 font-bold text-primary">
                {stat.stat < 10 && "0"}
                {stat.stat}
              </h1>
              <p className="text-body-3">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
