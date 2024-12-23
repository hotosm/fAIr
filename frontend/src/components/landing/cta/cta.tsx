import { Button } from "@/components/ui/button/";
import styles from "./cta.module.css";
import { APP_CONTENT } from "@/utils";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { HOTTeamTwo } from "@/assets/images";

export const CallToAction = () => {
  return (
    <section className={`${styles.container}`}>
      <div className={styles.cta}>
        <div className={styles.ctaContent}>
          <h1> {APP_CONTENT.homepage.callToAction.title}</h1>
          <p>{APP_CONTENT.homepage.callToAction.paragraph}</p>
        </div>
        <div className={styles.ctaButtonContainer}>
          <Link
            href={APP_CONTENT.homepage.callToAction.ctaLink}
            title={APP_CONTENT.homepage.callToAction.ctaButton}
            nativeAnchor
            blank
          >
            <Button variant="primary">
              {APP_CONTENT.homepage.callToAction.ctaButton}
            </Button>
          </Link>
        </div>
      </div>
      <div className={styles.imageBlock}>
        <Image
          src={HOTTeamTwo}
          alt={APP_CONTENT.homepage.callToAction.ctaButton}
          className={styles.image}
        />
        {/* The rectangles */}
        <div className={styles.dotsPattern}></div>
        <div className={styles.planeRectangle}></div>
      </div>
    </section>
  );
};
