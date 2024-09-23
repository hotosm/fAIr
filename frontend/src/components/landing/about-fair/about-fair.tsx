import AIIcon from '@/assets/fair_ai_icon.svg';
import styles from './about-fair.module.css'
import { APP_CONTENT } from '@/utils/content';

const WhatIsFAIR = () => {
    return (
        <section className={styles.aboutfAIrContainer}>
            <div className={styles.featureContent}>
                <h1 className={styles.heading}>{APP_CONTENT.homepage.aboutTitle}</h1>
                <p className={styles.paragraph}>
                    {APP_CONTENT.homepage.aboutContent}
                </p>
            </div>
            <div className={styles.imageContainer}>
                <img src={AIIcon} alt="AI Icon" />
                <div className={`${styles.dottedBorder}`}></div>
            </div>
        </section>
    )
}

export default WhatIsFAIR