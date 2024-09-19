import AIIcon from '@/assets/fair_ai_icon.svg';
import styles from './about-fair.module.css'

const WhatIsFAIR = () => {
    return (
        <section className={styles.aboutfAIr}>
            <div className={styles.aboutfAIrContainer}>
                <div className={styles.featureContent}>
                    <h1 className={styles.heading}>WHAT IS fAIr?</h1>
                    <p className={styles.paragraph}>
                        fAIr is an open AI-assisted mapping platform developed by the Humanitarian OpenStreetMap Team (HOT) that aims to improve the efficiency and accuracy of mapping efforts for humanitarian purposes. The service uses AI models, specifically computer vision techniques, to detect objects in satellite and UAV imagery.
                    </p>
                </div>
                <div className={styles.imageContainer}>
                    <img src={AIIcon} alt="AI Icon" />
                    <div className={styles.dottedBorder}></div>
                </div>
            </div>
        </section>
    )
}

export default WhatIsFAIR