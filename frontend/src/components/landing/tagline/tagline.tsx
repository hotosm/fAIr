
import { APP_CONTENT } from '@/utils/content';
import styles from './tagline.module.css';

const TaglineBanner = () => {
    return (
        <section className={styles.taglineBanner}>
            <p>
                <strong>{APP_CONTENT.homepage.tagline.firstSegment}</strong>
                <span>{APP_CONTENT.homepage.tagline.secondSegment}</span>
                <span className={styles.highlight}>{APP_CONTENT.homepage.tagline.thirdSegment}</span>
                <span>{APP_CONTENT.homepage.tagline.fourthSegment}</span>
                <strong>{APP_CONTENT.homepage.tagline.fifthSegment}</strong>
            </p>
        </section>
    );
};

export default TaglineBanner;
