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
    <section className="w-full h-full md:h-40 bg-frosted-blue rounded-xl">
      <div className="p-4 flex flex-col md:flex-row items-center h-full w-full justify-center gap-y-8 md:gap-y-0 md:justify-around">
        {profileStatsItems.map((stat) => (
          <div className="flex gap-x-3 items-center h-24 w-48" key={stat.label}>
            <div className="bg-primary rounded-full flex items-center justify-center h-12 w-12">
              <stat.icon className="h-8 w-8 text-white" />
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
