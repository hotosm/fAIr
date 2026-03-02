import styles from "./base-model-cta.module.css";
import { Button } from "@/components/ui/button/";
import { BaseModelCTAImage } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { SHARED_CONTENT } from "@/constants";
import { ButtonVariant } from "@/enums";

export const BaseModelCTA = () => {
  return (
    <section className={`${styles.container}`}>
      <div className={styles.cta}>
        <div className={styles.ctaContent}>
          <h1> {SHARED_CONTENT.homepage.baseModelCTA.title}</h1>
          <p>{SHARED_CONTENT.homepage.baseModelCTA.description}</p>
        </div>
        <div className={styles.ctaButtonContainer}>
          <Link
            href={SHARED_CONTENT.homepage.baseModelCTA.ctaLink}
            title={SHARED_CONTENT.homepage.baseModelCTA.ctaButton}
            nativeAnchor
          >
            <Button variant={ButtonVariant.SECONDARY}>
              {SHARED_CONTENT.homepage.baseModelCTA.ctaButton}
            </Button>
          </Link>
        </div>
      </div>
      <div className={styles.imageBlock}>
        <Image
          src={BaseModelCTAImage}
          alt={SHARED_CONTENT.homepage.baseModelCTA.title}
          className={styles.image}
        />
      </div>
    </section>
  );
};
