import { GuageIcon, LoopIcon, TimerIcon } from "@/components/ui/icons";
import styles from "./core-features.module.css";
import { IconProps } from "@/types";
import { APP_CONTENT } from "@/utils/content";

type TCoreFeatures = {
  title: string;
  icon: React.FC<IconProps>;
};
const coreFeatures: TCoreFeatures[] = [
  {
    title: APP_CONTENT.homepage.coreFeatures.featureOne,
    icon: TimerIcon,
  },
  {
    title: APP_CONTENT.homepage.coreFeatures.featureTwo,
    icon: GuageIcon,
  },
  {
    title: APP_CONTENT.homepage.coreFeatures.featureThree,
    icon: LoopIcon,
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
