import { APP_CONTENT } from "@/utils";
import styles from "./kpi.module.css";

type TKPIS = {
  figure: string;
  label: string;
}[];

const KPIs: TKPIS = [
  {
    figure: "15",
    label: APP_CONTENT.homepage.kpi.publishedAIModels,
  },
  {
    figure: "120",
    label: APP_CONTENT.homepage.kpi.totalUsers,
  },
  {
    figure: "100",
    label: APP_CONTENT.homepage.kpi.humanFeedback,
  },
  {
    figure: "15",
    label: APP_CONTENT.homepage.kpi.acceptedPrediction,
  }
  // ,
  // {
  //   figure: "86",
  //   label: "Mappers",
  // },
];

const Kpi = () => {
  return (
    <section className={styles.kpiContainer}>
      {KPIs.map((kpi, id) => (
        <div key={`kpi-${id}`} className={styles.kpiItem}>
          <h1>{kpi.figure}</h1>
          <h3>{kpi.label}</h3>
        </div>
      ))}
    </section>
  );
};

export default Kpi;
