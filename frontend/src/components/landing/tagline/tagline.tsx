import styles from "./tagline.module.css";
import { SHARED_CONTENT } from "@/constants";

export const TaglineBanner = () => {
  return (
    <section className={styles.taglineBanner}>
      <p>
        <strong>{SHARED_CONTENT.homepage.tagline.firstSegment}</strong>
        <span>{SHARED_CONTENT.homepage.tagline.secondSegment}</span>
        <span className={styles.highlight}>
          {SHARED_CONTENT.homepage.tagline.thirdSegment}
        </span>
        <span>{SHARED_CONTENT.homepage.tagline.fourthSegment}</span>
        <strong>{SHARED_CONTENT.homepage.tagline.fifthSegment}</strong>
      </p>
    </section>
  );
};
