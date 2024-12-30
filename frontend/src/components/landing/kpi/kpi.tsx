import styles from './kpi.module.css';
import { API_ENDPOINTS, apiClient } from '@/services';
import { KPI_STATS_CACHE_TIME_MS, SHARED_CONTENT } from '@/constants';
import { useQuery } from '@tanstack/react-query';
type TKPIS = {
  figure?: number;
  label: string;
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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kpis"],
    queryFn: fetchKPIStats,
    refetchInterval: KPI_STATS_CACHE_TIME_MS,
  });

  if (isError) {
    return (
      <section className={styles.kpiContainer}>
        <div>
          <h2>Error fetching KPI Stats</h2>
          <p>{(error as Error)?.message || "An unknown error occurred."}</p>
        </div>
      </section>
    );
  }

  const KPIs: TKPIS = [
    {
      figure: data?.total_models_published ?? 0,
      label: SHARED_CONTENT.homepage.kpi.publishedAIModels,
    },
    {
      figure: data?.total_registered_users ?? 0,
      label: SHARED_CONTENT.homepage.kpi.totalUsers,
    },
    {
      figure: data?.total_feedback_labels ?? 0,
      label: SHARED_CONTENT.homepage.kpi.humanFeedback,
    },
    {
      figure: data?.total_accepted_predictions ?? 0,
      label: SHARED_CONTENT.homepage.kpi.acceptedPrediction,
    },
  ];

  return (
    <section className={styles.kpiContainer}>
      {KPIs.map((kpi, id) => (
        <div key={`kpi-${id}`} className={styles.kpiItem}>
          <h1 className={`${isLoading ? "animate-pulse" : ""}`}>
            {kpi.figure?.toLocaleString()}
          </h1>
          <h3>{kpi.label}</h3>
        </div>
      ))}
    </section>
  );
};
