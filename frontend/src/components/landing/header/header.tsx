import BackgroundImage from "@/assets/images/header_bg.jpg";
import styles from "@/components/landing/header/header.module.css";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";

export const Header = () => {
  return (
    <header className={styles.headerContainer}>
      <main className={`${styles.jumbotronContainer}`}>
        <div className={`${styles.jumbotronContentContainer}`}>
          <div className={styles.jumbotronText}>
            <h1>{SHARED_CONTENT.homepage.jumbotronTitle}</h1>
            <p>{SHARED_CONTENT.homepage.jumbotronHeadline}</p>
          </div>
          <div className={styles.ctaButtons}>
            <Link
              href={APPLICATION_ROUTES.CREATE_NEW_MODEL}
              title={SHARED_CONTENT.homepage.ctaPrimaryButton}
              nativeAnchor={false}
            >
              <Button variant="primary">
                {SHARED_CONTENT.homepage.ctaPrimaryButton}
              </Button>
            </Link>
            <Link
              href={APPLICATION_ROUTES.MODELS}
              title={SHARED_CONTENT.homepage.ctaPrimaryButton}
              nativeAnchor={false}
            >
              <Button variant="secondary">
                {SHARED_CONTENT.homepage.ctaSecondaryButton}
              </Button>
            </Link>
          </div>
        </div>
        <div className={styles.jumbotronImage}>
          <Image
            src={BackgroundImage}
            alt={SHARED_CONTENT.homepage.jumbotronImageAlt}
            width="100%"
            height="100%"
          />
        </div>
      </main>
    </header>
  );
};
