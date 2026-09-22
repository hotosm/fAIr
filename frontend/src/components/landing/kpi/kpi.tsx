import { API_ENDPOINTS, apiClient } from "@/services";
import { KPI_STATS_CACHE_TIME_MS } from "@/config";
import { SHARED_CONTENT } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, FC } from "react";
import {
  BotIcon,
  FeedbackIcon,
  PeopleIcon,
  ProductionCheckmarkIcon,
} from "@/components/ui/icons";
import { IconProps } from "@/types";

type TKPIS = {
  figure?: number;
  label: string;
  icon: FC<IconProps>;
}[];

type TKPIResponse = {
  total_accepted_predictions: number;
  total_feedback_labels: number;
  total_models_published: number;
  total_registered_users: number;
};

const fetchKPIStats = async (): Promise<TKPIResponse> => {
  const { data } = await apiClient.get(API_ENDPOINTS.GET_KPI_STATS);
  return data;
};

export const Kpi = () => {
  const [enabled, setEnabled] = useState<boolean>(false);

  const { data } = useQuery({
    queryKey: ["kpis"],
    queryFn: fetchKPIStats,
    refetchInterval: KPI_STATS_CACHE_TIME_MS,
    enabled: enabled,
  });

  /**
   * This effect is used to delay the KPI stats fetching by 1 second.
   * This is done to allow the page to load first and then fetch the KPI stats.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const KPIs: TKPIS = [
    {
      figure: data?.total_models_published ?? 0,
      label: SHARED_CONTENT.homepage.kpi.publishedAIModels,
      icon: BotIcon,
    },
    {
      figure: data?.total_registered_users ?? 0,
      label: SHARED_CONTENT.homepage.kpi.totalUsers,
      icon: PeopleIcon,
    },
    {
      figure: data?.total_feedback_labels ?? 0,
      label: SHARED_CONTENT.homepage.kpi.humanFeedback,
      icon: FeedbackIcon,
    },
    {
      figure: data?.total_accepted_predictions ?? 0,
      label: SHARED_CONTENT.homepage.kpi.acceptedPrediction,
      icon: ProductionCheckmarkIcon,
    },
  ];

  return (
    <section className="p-4 grid grid-cols-1 gap-y-4 sm:grid-cols-2 min-h-40 place-items-center lg:grid-cols-4 justify-items-center bg-off-white">
      {KPIs.map((kpi, id) => (
        <div
          className={`flex gap-x-3 items-center h-24 w-48`}
          key={`kpi-${id}`}
        >
          <div className="bg-primary rounded-full flex items-center justify-center p-2">
            <kpi.icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <h1
              className={`text-title-2 font-bold text-primary ${!data ? "animate-pulse" : ""}`}
            >
              {kpi.figure?.toLocaleString()}
            </h1>
            <p className="text-body-3 font-semibold text-nowrap">{kpi.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
};
