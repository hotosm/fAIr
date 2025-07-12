import { API_ENDPOINTS, apiClient } from "@/services";
import { KPI_STATS_CACHE_TIME_MS } from "@/config";
import { SHARED_CONTENT } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  BotIcon,
  FeedbackIcon,
  PeopleIcon,
  ProductionCheckmarkIcon,
} from "@/components/ui/icons";

type KPIResponse = {
  total_accepted_predictions: number;
  total_feedback_labels: number;
  total_models_published: number;
  total_registered_users: number;
};

const fetchKPIStats = async (): Promise<KPIResponse> => {
  const { data } = await apiClient.get(API_ENDPOINTS.GET_KPI_STATS);
  return data;
};

export const Kpi = () => {
  const [enabled, setEnabled] = useState(false);

  const { data } = useQuery({
    queryKey: ["kpis"],
    queryFn: fetchKPIStats,
    refetchInterval: KPI_STATS_CACHE_TIME_MS,
    enabled,
  });

  useEffect(() => {
    const timer = setTimeout(() => setEnabled(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const kpis = [
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
    <section className="grid min-h-40 grid-cols-1 place-items-center justify-items-center gap-y-4 bg-off-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, id) => (
        <div className="flex h-24 w-48 items-center gap-x-3" key={id}>
          <div className="flex items-center justify-center rounded-full bg-primary p-2">
            <kpi.icon className="size-8 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <h1
              className={`text-title-2 font-bold text-primary ${!data ? "animate-pulse" : ""}`}
            >
              {kpi.figure?.toLocaleString()}
            </h1>
            <p className="text-nowrap text-body-3 font-semibold">{kpi.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
};
