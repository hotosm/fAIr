import styles from "./core-features.module.css";
import {
  Eye,
  LockKeyholeOpen,
  MapPin,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { SHARED_CONTENT } from "@/constants";

type TCoreFeatures = {
  title: string;
  icon: LucideIcon;
};
const coreFeatures: TCoreFeatures[] = [
  {
    title: SHARED_CONTENT.homepage.coreFeatures.featureOne,
    icon: LockKeyholeOpen,
  },
  {
    title: SHARED_CONTENT.homepage.coreFeatures.featureTwo,
    icon: Eye,
  },
  {
    title: SHARED_CONTENT.homepage.coreFeatures.featureThree,
    icon: MapPin,
  },
  {
    title: SHARED_CONTENT.homepage.coreFeatures.featureFour,
    icon: Repeat,
  },
];

export const CoreFeatures = () => {
  return (
    <section className={styles.coreFeatures}>
      {coreFeatures.map((feature, id) => (
        <div className={styles.coreFeatureItem} key={`core-feature-${id}`}>
          <div className={styles.coreFeatureIconContainer}>
            <feature.icon className={styles.coreFeatureIcon} />
          </div>
          <h3>{feature.title}</h3>
        </div>
      ))}
    </section>
  );
};
