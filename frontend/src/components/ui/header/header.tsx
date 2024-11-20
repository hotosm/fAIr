import { Button } from "@/components/ui/button";
import styles from "./header.module.css";
import BackgroundImage from "@/assets/images/header_bg.png";
import { APP_CONTENT } from "@/utils/content";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/utils";

const Header = () => {
  return (
    <header className={styles.headerContainer}>
      <main className={styles.jumbotronContainer}>
        <div className={styles.jumbotronContentContainer}>
          <div className={styles.jumbotronText}>
            <h1>{APP_CONTENT.homepage.jumbotronTitle}</h1>
            <p>{APP_CONTENT.homepage.jumbotronHeadline}</p>
          </div>
          <div className={styles.ctaButtons}>
            <Link
              href={APPLICATION_ROUTES.CREATE_NEW_MODEL}
              title={APP_CONTENT.homepage.ctaPrimaryButton}
              nativeAnchor={false}
            >
              <Button variant="primary">
                {" "}
                {APP_CONTENT.homepage.ctaPrimaryButton}
              </Button>
            </Link>
            <Button variant="secondary">
              {APP_CONTENT.homepage.ctaSecondaryButton}
            </Button>
          </div>
        </div>
        <div className={styles.jumbotronImage}>
          <Image
            src={BackgroundImage}
            alt={APP_CONTENT.homepage.jumbotronImageAlt}
            width="100%"
            height="100%"
          />
        </div>
      </main>
    </header>
  );
};

export default Header;
